const express = require('express');
const router = express.Router();
const Review = require('../models/Productreview');
const Product = require('../models/Product');
// const { protect } = require('../middlewares/authMiddleware');

// ✅ GET reviews with summary data
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Get all reviews for the product
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });

    const totalRatings = reviews.length;
    const ratingSum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = totalRatings > 0 ? (ratingSum / totalRatings).toFixed(1) : 0;

    // Generate distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating]++;
    });

    res.status(200).json({
      averageRating,
      totalRatings,
      ratingDistribution,
      reviews,
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// ✅ POST a new review (auth optional)
router.post('/',  async (req, res) => {
  const { productId, rating, name, text } = req.body;

  if (!productId || !rating || !name || !text) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const review = await Review.create({
      productId,
      name,
      rating,
      text,
    });

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ message: 'Failed to submit review' });
  }
});

module.exports = router;
