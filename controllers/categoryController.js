const Category = require("../models/Category");
const upload = require("../middlewares/multer");

// Create Category (image + banner + logo support)
exports.createCategory = [
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, slug, parentCategory } = req.body;

      // Validate fields
      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }

      // Validate parent category
      if (parentCategory) {
        const parent = await Category.findById(parentCategory);
        if (!parent) {
          return res.status(400).json({ message: "Parent category not found" });
        }
      }

      // Image paths
      const image = req.files?.image?.[0]?.filename || null;
      const banner = req.files?.banner?.[0]?.filename || null;
      const logo = req.files?.logo?.[0]?.filename || null;

      const category = new Category({
        name,
        slug,
        parentCategory: parentCategory || null,
        image: image ? `/uploads/${image}` : null,
        banner: banner ? `/uploads/${banner}` : null,
        logo: logo ? `/uploads/${logo}` : null,
      });

      await category.save();

      res.status(201).json({
        message: "Category created successfully",
        category,
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating category", error: error.message });
    }
  }
];

// Get All Categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parentCategory');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error: error.message });
  }
};

// Get Single Category
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parentCategory');
    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error fetching category", error: error.message });
  }
};

// Update Category (support all images)
exports.updateCategory = [
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, slug, parentCategory } = req.body;
      const categoryId = req.params.id;

      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }

      const category = await Category.findById(categoryId);
      if (!category) return res.status(404).json({ message: "Category not found" });

      if (parentCategory) {
        const parent = await Category.findById(parentCategory);
        if (!parent) return res.status(400).json({ message: "Parent category not found" });
      }

      const image = req.files?.image?.[0]?.filename;
      const banner = req.files?.banner?.[0]?.filename;
      const logo = req.files?.logo?.[0]?.filename;

      category.name = name;
      category.slug = slug;
      category.parentCategory = parentCategory || null;
      if (image) category.image = `/uploads/${image}`;
      if (banner) category.banner = `/uploads/${banner}`;
      if (logo) category.logo = `/uploads/${logo}`;

      await category.save();

      res.json({ message: "Category updated successfully", category });
    } catch (error) {
      res.status(500).json({ message: "Error updating category", error: error.message });
    }
  }
];

// Get Top-Level Categories (no parentCategory)
exports.getTopLevelCategories = async (req, res) => {
  try {
    const topCategories = await Category.find({ parentCategory: null });
    res.json(topCategories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching top-level categories", error: error.message });
  }
};


// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const subCategories = await Category.find({ parentCategory: req.params.id });
    if (subCategories.length > 0) {
      return res.status(400).json({ message: "This category has subcategories and cannot be deleted" });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error: error.message });
  }
};
