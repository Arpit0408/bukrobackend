const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middlewares/authMiddleware');

// 🔹 GET all addresses
router.get('/', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.addresses);
});

// 🔹 POST: Add new address
router.post('/add', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.push(req.body);
  await user.save();
//   res.json({ message: 'Address added', addresses: user.addresses });
 const newAddress = user.addresses[user.addresses.length - 1];  // Get the newly added address

  res.json(newAddress);  // Return only the new address with _id
});

// 🔹 PUT: Update address by ID
router.put('/update/:addressId', protect, async (req, res) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);

  const address = user.addresses.id(addressId);
  if (!address) return res.status(404).json({ message: 'Address not found' });

  Object.assign(address, req.body); // Merge updates
  await user.save();

  res.json({ message: 'Address updated', address });
});

// 🔹 DELETE: Remove address by ID
router.delete('/remove/:addressId', protect, async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Filter addresses to remove the one with the matching id
    const originalLength = user.addresses.length;
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);

    if (user.addresses.length === originalLength) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await user.save();

    res.json({ message: 'Address deleted', addresses: user.addresses });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Server error while deleting address' });
  }
});

module.exports = router;
