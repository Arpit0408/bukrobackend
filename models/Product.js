const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String, default: "" },
  basePrice: { type: Number, required: true, min: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  tags: [{ type: String }],
  images: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model("Product", productSchema);
