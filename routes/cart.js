const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Variant = require('../models/Variant');

// ✅ FIXED: Named import for protect middleware
const { protect } = require('../middlewares/authMiddleware');

// ✅ GET Cart
router.get('/', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.variant');
  res.json(user.cart);
});

// ✅ Add or Update item in Cart
router.post('/add', protect, async (req, res) => {
  const { variantId, quantity = 1 } = req.body;
  const user = await User.findById(req.user._id);

  const existingItem = user.cart.find(
    (item) => item.variant.toString() === variantId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    user.cart.push({ variant: variantId, quantity });
  }

  await user.save();
  res.json({ message: 'Item added to cart', cart: user.cart });
});

// ✅ Remove Item
router.delete('/remove/:variantId', protect, async (req, res) => {
  const { variantId } = req.params;
  const user = await User.findById(req.user._id);

  user.cart = user.cart.filter(
    (item) => item.variant.toString() !== variantId
  );

  await user.save();
  res.json({ message: 'Item removed from cart', cart: user.cart });
});

// ✅ Update Quantity
router.patch('/update', protect, async (req, res) => {
  const { variantId, quantity } = req.body;
  const user = await User.findById(req.user._id);

  const item = user.cart.find(
    (item) => item.variant.toString() === variantId
  );

  if (!item) return res.status(404).json({ message: 'Item not in cart' });

  if (quantity <= 0) {
    user.cart = user.cart.filter((i) => i.variant.toString() !== variantId);
  } else {
    item.quantity = quantity;
  }

  await user.save();
  res.json({ message: 'Cart updated', cart: user.cart });
});

module.exports = router;
