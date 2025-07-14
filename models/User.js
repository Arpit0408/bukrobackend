


const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
  quantity: { type: Number, default: 1 },
  addedAt: { type: Date, default: Date.now }
});


const addressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  mobile: String,
  pinCode: String,
  city: String,
  state: String,
  addressLine: String,
  area: String,
  landmark: String,
  addressType: { type: String, enum: ['Home', 'Office', 'Other'] },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: [cartItemSchema],
  addresses: [addressSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
