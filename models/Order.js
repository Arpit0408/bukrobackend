const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }, // price at order time
    },
  ],
  shippingAddress: {
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
  },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cod', 'razorpay'], required: true },
  paymentStatus: { type: String,
  enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid', 'completed'],
  default: 'pending'},
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  createdAt: { type: Date, default: Date.now },
});




module.exports = mongoose.model('Order', orderSchema);
