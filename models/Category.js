const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String },        // Category image
  banner: { type: String },       // Banner image
  logo: { type: String },         // Logo image
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Category", categorySchema);
