const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productVariant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariation',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // one cart per user
  },
  items: [CartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);
