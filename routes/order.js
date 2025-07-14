const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middlewares/authMiddleware');
require('dotenv').config();

router.post('/order', protect, async (req, res) => {
  const {
    items,
    shippingAddress,
    totalAmount,
    paymentMethod,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  } = req.body;

  if (paymentMethod === 'razorpay') {
const body = razorpayOrderId + "|" + razorpayPaymentId;
const expected = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET) // ✅ this is correct
  .update(razorpayOrderId + "|" + razorpayPaymentId)
  .digest('hex');
  console.log("Razorpay Order ID:", razorpayOrderId);
  console.log("Razorpay Payment ID:", razorpayPaymentId); 
  console.log("Razorpay Signature:", razorpaySignature);
  

console.log("ORDER ID:", razorpayOrderId);
console.log("PAYMENT ID:", razorpayPaymentId);
console.log("SIGNATURE:", razorpaySignature);
console.log("EXPECTED SIGNATURE:", expected);


   if (expected !== razorpaySignature) {
  console.error('Signature mismatch!');
  return res.status(400).json({ error: 'Invalid Razorpay signature' });
}

  }

  try {
    const order = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    await order.save();
    await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

    res.status(201).json(order);
  } catch (err) {
    console.error('Order save failed:', err);
    res.status(500).json({ error: 'Order save failed' });
  }
});


router.get('/order', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.variant') // populate variant if needed
      .sort({ createdAt: -1 });  // latest orders first

    res.json(orders);
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/allorder', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name avatar')         // populate client info (optional)
      .populate('items.variant')               // populate product variant if needed
      .sort({ createdAt: -1 });                // latest orders first

    res.json(orders);
  } catch (err) {
    console.error('Failed to fetch all orders:', err);
    res.status(500).json({ error: 'Failed to fetch all orders' });
  }
});

// Add this in your existing router file (e.g., routes/order.js)

// PATCH /order/:id/status
router.patch("/order/:id/status", async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required in body" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.paymentStatus = status;
    await order.save();

    res.json({ message: "Order paymentStatus updated", order });
  } catch (err) {
    console.error("Failed to update order status:", err); // <-- 🔍 Yahan dekhna
    res.status(500).json({ error: "Failed to update order status" });
  }
});




module.exports = router;
