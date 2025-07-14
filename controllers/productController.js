const Product = require("../models/Product");
const Category = require("../models/Category");
const Variant = require("../models/Variant");
const upload = require("../middlewares/multer");
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

// ----------------------------
// Helper: Delete Image Files
// ----------------------------
const deleteImageFiles = (imagePaths = []) => {
    imagePaths.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        fs.unlink(fullPath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error(`Failed to delete file: ${fullPath}`, err);
            }
        });
    });
};

// ----------------------------
// CREATE Product + Variants
// ----------------------------
exports.createProduct = [
  upload.any(),
  async (req, res) => {
    try {
      const { name, description, basePrice, category } = req.body;
      let variations = req.body.variations;

      if (!name || !description || !basePrice || !category) {
        return res.status(400).json({ message: "Missing required fields: name, description, basePrice, category." });
      }

      const categoryExists = await Category.findById(category);
      if (!categoryExists) return res.status(400).json({ message: "Invalid category." });

      // Slug generate karo aur uniqueness check karo
      let slug = slugify(name, { lower: true, strict: true });
      let slugExists = await Product.findOne({ slug });

      let count = 1;
      while (slugExists) {
        slug = slugify(name, { lower: true, strict: true }) + '-' + count;
        slugExists = await Product.findOne({ slug });
        count++;
      }

      // Parse variations
      let parsedVariations = [];
      try {
        parsedVariations = variations ? JSON.parse(variations) : [];
        if (!Array.isArray(parsedVariations)) throw new Error("Variations must be an array.");
      } catch (err) {
        return res.status(400).json({ message: "Invalid JSON for variations.", error: err.message });
      }

      // Product images
      const productImagePaths = req.files
        .filter(file => file.fieldname === "images")
        .map(file => `/uploads/${file.filename}`);

      // Variant image mapping
      const variantImageMap = {};
      req.files.forEach(file => {
        const match = file.fieldname.match(/variantImages\[(\d+)]/);
        if (match) {
          const idx = parseInt(match[1], 10);
          if (!variantImageMap[idx]) variantImageMap[idx] = [];
          variantImageMap[idx].push(`/uploads/${file.filename}`);
        }
      });

      const newProduct = await new Product({
        name,
        slug,                    // <-- add slug here
        description,
        basePrice: parseFloat(basePrice),
        category,
        images: productImagePaths,
      }).save();

      const variants = await Promise.all(parsedVariations.map(async (v, idx) => {
        const images = variantImageMap[idx] || [];
        return new Variant({
          product: newProduct._id,
          sku: v.sku,
          price: parseFloat(v.price),
          stock: parseInt(v.stock, 10),
          image: images[0] || "",
          images,
          attributes: {
            size: Array.isArray(v.attributes?.size) ? v.attributes.size : [],
            color: v.attributes?.color || "",
            material: v.attributes?.material || ""
          }
        }).save();
      }));

      res.status(201).json({ message: "Product created successfully.", product: newProduct, variants });
    } catch (err) {
      console.error("Create error:", err);
      if (req.files) {
        const allUploaded = req.files.map(f => `/uploads/${f.filename}`);
        deleteImageFiles(allUploaded);
      }
      res.status(500).json({ message: "Server error while creating product.", error: err.message });
    }
  }
];


// ----------------------------
// GET All Products
// ----------------------------
// Recursive function to get all subcategory IDs
const getSubcategoryIds = async (parentId) => {
  const subCategories = await Category.find({ parentCategory: parentId }).select("_id");
  const ids = subCategories.map((cat) => cat._id.toString());

  for (const sub of subCategories) {
    const childIds = await getSubcategoryIds(sub._id);
    ids.push(...childIds);
  }

  return ids;
};

// Inside your controllers/productController.js
exports.getAllProducts = async (req, res) => {
  try {
    const { search, category, color, size, price_min, price_max, sortBy, order = 'asc', page = 1, limit = 20 } = req.query;

    const match = {};

    if (search) {
      match.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      const cat = await Category.findOne({ slug: category }).select('_id');
      if (!cat) {
        return res.json([]);
      }
      const subIds = await getSubcategoryIds(cat._id.toString());
      match.category = { $in: [cat._id, ...subIds] };
    }

    const pipeline = [
      { $match: match },
      { $lookup: { from: 'variants', localField: '_id', foreignField: 'product', as: 'variants' } },
      { $unwind: '$variants' }
    ];

    if (color) {
      pipeline.push({
        $match: { 'variants.attributes.color': { $in: color.split(',') } }
      });
    }

    if (size) {
      pipeline.push({
        $match: { 'variants.attributes.size': { $in: size.split(',') } }
      });
    }

    if (price_min || price_max) {
      pipeline.push({
        $match: {
          'variants.price': {
            ...(price_min && { $gte: Number(price_min) }),
            ...(price_max && { $lte: Number(price_max) })
          }
        }
      });
    }

    pipeline.push({
      $group: {
        _id: '$_id',
        doc: { $first: '$$ROOT' },
        totalStock: { $sum: '$variants.stock' },
        variants: { $push: '$variants' }
      }
    });

    if (sortBy) {
      pipeline.push({
        $sort: {
          [`doc.${sortBy}`]: order === 'desc' ? -1 : 1
        }
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    pipeline.push({ $skip: skip }, { $limit: Number(limit) });

    pipeline.push({
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$$ROOT.doc', { totalStock: '$totalStock', variants: '$variants' }]
        }
      }
    });

    const products = await Product.aggregate(pipeline);
    res.json(products);
  } catch (err) {
    console.error('Product fetch error:', err);
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};

// GET products by category (including subcategories)
exports.getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Find the category by slug
    const category = await Category.findOne({ slug }).select('_id');
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // 2. Get all subcategory IDs recursively
    const subCategoryIds = await getSubcategoryIds(category._id.toString());
    const categoryIds = [category._id, ...subCategoryIds];

    // 3. Find all products in these categories
    const products = await Product.find({ category: { $in: categoryIds } })
      .populate('category')
      .lean();

    // 4. Attach variants to each product
    const productIds = products.map(p => p._id);
    const variants = await Variant.find({ product: { $in: productIds } }).lean();

    // 5. Group variants under their respective products
    const variantMap = {};
    variants.forEach(v => {
      const pid = v.product.toString();
      if (!variantMap[pid]) variantMap[pid] = [];
      variantMap[pid].push(v);
    });

    const finalProducts = products.map(p => ({
      ...p,
      variations: variantMap[p._id.toString()] || []
    }));

    res.json(finalProducts);
  } catch (err) {
    console.error('Category-wise fetch failed:', err);
    res.status(500).json({ message: 'Error fetching products by category', error: err.message });
  }
};


// ----------------------------
// GET Product by ID
// ----------------------------
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("category");
        if (!product) return res.status(404).json({ message: "Product not found." });

        const variants = await Variant.find({ product: product._id });
        res.json({
            ...product.toObject(),
            variations: variants
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching product.", error: err.message });
    }
};

// ----------------------------
// UPDATE Product + Variants
// ----------------------------
exports.updateProduct = [
    upload.any(),
    async (req, res) => {
        try {
            const productId = req.params.id;
            const { name, description, basePrice, category } = req.body;
            const oldImages = req.body.oldImages;
            let variations = req.body.variations;

            const product = await Product.findById(productId);
            if (!product) return res.status(404).json({ message: "Product not found." });

            const categoryExists = await Category.findById(category);
            if (!categoryExists) return res.status(400).json({ message: "Invalid category." });

            let parsedVariations = [];
            try {
                parsedVariations = variations ? JSON.parse(variations) : [];
                if (!Array.isArray(parsedVariations)) throw new Error();
            } catch {
                return res.status(400).json({ message: "Invalid variations JSON." });
            }

            let oldImageArr = [];
            try {
                oldImageArr = oldImages ? JSON.parse(oldImages) : [];
                if (!Array.isArray(oldImageArr)) throw new Error();
            } catch {
                return res.status(400).json({ message: "Invalid old images JSON." });
            }

            const newImages = req.files
                .filter(f => f.fieldname === "images")
                .map(f => `/uploads/${f.filename}`);
            const finalImages = [...oldImageArr, ...newImages];

            const imagesToDelete = product.images.filter(img => !oldImageArr.includes(img));
            if (imagesToDelete.length) deleteImageFiles(imagesToDelete);

            product.set({
                name,
                description,
                basePrice: parseFloat(basePrice),
                category,
                images: finalImages
            });
            await product.save();

            const imageMap = {};
            req.files.forEach(file => {
                const match = file.fieldname.match(/variantImages\[(\d+)]/);
                if (match) {
                    const idx = parseInt(match[1], 10);
                    if (!imageMap[idx]) imageMap[idx] = [];
                    imageMap[idx].push(`/uploads/${file.filename}`);
                }
            });

            const existingIds = parsedVariations.filter(v => v._id).map(v => v._id.toString());
            const dbVariants = await Variant.find({ product: productId });

            const toDelete = dbVariants.filter(dbV => !existingIds.includes(dbV._id.toString()));
            for (let v of toDelete) {
                deleteImageFiles(v.images);
                await Variant.findByIdAndDelete(v._id);
            }

            const updatedVariants = await Promise.all(parsedVariations.map(async (v, idx) => {
                const newImgs = imageMap[idx] || [];
                const oldImgs = Array.isArray(v.oldImages) ? v.oldImages : [];
                const finalImgs = [...oldImgs, ...newImgs];

                if (v._id) {
                    const existing = await Variant.findById(v._id);
                    if (!existing) return;
                    const toRemove = existing.images.filter(img => !oldImgs.includes(img));
                    deleteImageFiles(toRemove);

                    existing.set({
                        sku: v.sku,
                        price: parseFloat(v.price),
                        stock: parseInt(v.stock, 10),
                        image: finalImgs[0] || "",
                        images: finalImgs,
                        attributes: {
                            size: Array.isArray(v.attributes?.size) ? v.attributes.size : [],
                            color: v.attributes?.color || "",
                            material: v.attributes?.material || ""
                        }
                    });
                    return existing.save();
                }

                return new Variant({
                    product: productId,
                    sku: v.sku,
                    price: parseFloat(v.price),
                    stock: parseInt(v.stock, 10),
                    image: finalImgs[0] || "",
                    images: finalImgs,
                    attributes: {
                        size: Array.isArray(v.attributes?.size) ? v.attributes.size : [],
                        color: v.attributes?.color || "",
                        material: v.attributes?.material || ""
                    }
                }).save();
            }));

            res.json({ message: "Product updated.", product, variants: updatedVariants });
        } catch (err) {
            console.error("Update error:", err);
            const uploaded = req.files.map(f => `/uploads/${f.filename}`);
            deleteImageFiles(uploaded);
            res.status(500).json({ message: "Error updating product.", error: err.message });
        }
    }
];

// ----------------------------
// DELETE Product + Variants
// ----------------------------
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found." });

        const variants = await Variant.find({ product: product._id });
        const allImages = [...(product.images || []), ...variants.flatMap(v => v.images || [])];
        deleteImageFiles(allImages);

        await Product.findByIdAndDelete(req.params.id);
        await Variant.deleteMany({ product: product._id });

        res.json({ message: "Product and variants deleted." });
    } catch (err) {
        res.status(500).json({ message: "Delete failed.", error: err.message });
    }
};
