const User = require('../models/User');
const Product = require('../models/Product');

// GET /api/users/:id/wishlist
exports.getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('wishlist');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user.wishlist);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/users/:id/wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        user.wishlist.push(productId);
        await user.save();
        res.status(200).json({ message: 'Added to wishlist' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/users/:id/wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
    try {
        const { id, productId } = req.params;
        const user = await User.findById(id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.wishlist = user.wishlist.filter(p => p.toString() !== productId);
        await user.save();

        res.status(200).json({ message: 'Removed from wishlist' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/users/:id/wishlist  <-- Clear entire wishlist
exports.clearWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.wishlist = [];
        await user.save();

        res.status(200).json({ message: 'Wishlist cleared' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};