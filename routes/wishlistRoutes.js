// backend/routes/wishlistRoutes.js
const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.userId }).populate('products');
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.userId, products: [] });
    }
    res.json(wishlist.products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/add', protect, async (req, res) => {
  const { productId } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let wishlist = await Wishlist.findOne({ user: req.userId });
    if (!wishlist) wishlist = new Wishlist({ user: req.userId, products: [] });

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    await wishlist.populate('products');
    res.json(wishlist.products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/remove', protect, async (req, res) => {
  const { productId } = req.body;
  try {
    const wishlist = await Wishlist.findOne({ user: req.userId });
    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });

    wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
    await wishlist.save();
    await wishlist.populate('products');
    res.json(wishlist.products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;