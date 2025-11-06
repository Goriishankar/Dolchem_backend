// backend/routes/metricsRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

const getStartOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};


router.get('/public', async (req, res) => {
  try {
    const startOfToday = getStartOfToday();
    const startOfMonth = getStartOfMonth();

    const todayResult = await Order.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]);
    const todayRevenue = todayResult[0]?.revenue || 0;

    const monthResult = await Order.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]);
    const monthRevenue = monthResult[0]?.revenue || 0;

    const totalResult = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = totalResult[0]?.revenue || 0;

    res.json({
      todayRevenue,
      monthRevenue,
      totalRevenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;