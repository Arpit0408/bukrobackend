const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountPercentage: Number,
  expiryDate: Date,
  usageLimit: Number
});

module.exports = mongoose.model('Coupon', couponSchema);
