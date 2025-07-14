const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middlewares/authMiddleware');

// ✅ GET wishlist items (populated)
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ message: 'Failed to fetch wishlist' });
  }
});

// ✅ ADD to wishlist
router.post('/add', protect, async (req, res) => {
  const { productId } = req.body;
  try {
    const user = await User.findById(req.user._id);

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    const updated = await user.populate('wishlist');
    res.json({ message: 'Product added to wishlist', wishlist: updated.wishlist });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ message: 'Failed to add to wishlist' });
  }
});

// ✅ REMOVE from wishlist
router.delete('/remove/:productId', protect, async (req, res) => {
  const { productId } = req.params;
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );
    await user.save();

    const updated = await user.populate('wishlist');
    res.json({ message: 'Product removed from wishlist', wishlist: updated.wishlist });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ message: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
