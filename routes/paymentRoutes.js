const express = require('express');
const router = express.Router();
const razorpay = require('../config/razorpay');
const { protect } = require('../middlewares/authMiddleware');

router.post('/order', protect, async (req, res) => {
  const { amount } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const options = {
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: 'receipt_order_' + Math.floor(Math.random() * 1000000),
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

module.exports = router;
