const mongoose = require("mongoose");

const attributeSchema = new mongoose.Schema({
  size: [{ type: String }],
  color: { type: String },
  material: { type: String }
}, { _id: false });

const variantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  sku: { type: String, required: true, unique: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  image: { type: String },
  images: [{ type: String }],
  isDefault: { type: Boolean, default: false },
  attributes: attributeSchema
}, {
  timestamps: true
});

module.exports = mongoose.model("Variant", variantSchema);
