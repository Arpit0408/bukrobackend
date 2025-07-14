const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const ProductVariation = require('../models/ProductVariation');
const { protect } = require('../middlewares/authMiddleware');
const mongoose = require('mongoose');

// POST /api/cart/add - Add or increase quantity of a variant in cart
router.post('/add', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { variantId, quantity } = req.body;

    if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: 'Invalid variantId' });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const variant = await ProductVariation.findById(variantId);
    if (!variant) return res.status(404).json({ message: 'Product variant not found' });
    if (variant.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if variant already in cart
    const index = cart.items.findIndex(item =>
      item.productVariant.toString() === variantId
    );

    if (index > -1) {
      const newQty = cart.items[index].quantity + quantity;
      if (variant.stock < newQty) {
        return res.status(400).json({ message: 'Not enough stock for requested quantity' });
      }
      cart.items[index].quantity = newQty;
    } else {
      cart.items.push({
        productVariant: variantId,
        quantity,
      });
    }

    await cart.save();

    // Populate for returning detailed info
    await cart.populate({
      path: 'items.productVariant',
      populate: { path: 'product', model: 'Product' }
    });

    res.json({ message: 'Added to cart successfully', cart });
  } catch (error) {
    console.error('❌ Add to cart error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/cart - Get user's cart
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.productVariant',
      populate: { path: 'product', model: 'Product' },
    });

    if (!cart) return res.json({ items: [] });

    res.json(cart);
  } catch (error) {
    console.error('❌ Fetch cart error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/cart/update - Update quantity or remove item
router.put('/update', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { variantId, quantity } = req.body;

    if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: 'Invalid variantId' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const index = cart.items.findIndex(item =>
      item.productVariant.toString() === variantId
    );

    if (index === -1) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity <= 0) {
      // Remove item if quantity zero or less
      cart.items.splice(index, 1);
    } else {
      const variant = await ProductVariation.findById(variantId);
      if (!variant) return res.status(404).json({ message: 'Variant not found' });
      if (variant.stock < quantity) {
        return res.status(400).json({ message: 'Not enough stock' });
      }

      cart.items[index].quantity = quantity;
    }

    await cart.save();

    // Populate before sending back
    await cart.populate({
      path: 'items.productVariant',
      populate: { path: 'product', model: 'Product' }
    });

    res.json({ message: 'Cart updated', cart });
  } catch (error) {
    console.error('❌ Update cart error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
