// backend/routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');


const getStartOfDay = () => new Date(new Date().setHours(0, 0, 0, 0));
const getStartOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);

// === 1. TODAY STATS ===
router.get('/today', protect, async (req, res) => {
  try {
    const start = getStartOfDay();
    const result = await Order.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: start } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
    ]);
    const data = result[0] || { orders: 0, revenue: 0 };
    res.json({ orders: data.orders, revenue: data.revenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === 2. MONTH REVENUE ===
router.get('/month', protect, async (req, res) => {
  try {
    const start = getStartOfMonth();
    const result = await Order.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: start } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]);
    res.json({ revenue: result[0]?.revenue || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === 3. OVERALL STATS (Customers, Carts, Orders, Revenue) ===
router.get('/overall', protect, async (req, res) => {
  try {
    const [customers, carts, overall] = await Promise.all([
      User.countDocuments(),
      Cart.countDocuments({ 'items.0': { $exists: true } }),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
      ])
    ]);

    const data = overall[0] || { orders: 0, revenue: 0 };

    res.json({
      totalCustomers: customers,
      totalCarts: carts,
      totalOrders: data.orders,
      totalRevenue: data.revenue
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === 4. NEW: STATE-WISE LOGIN COUNT (FOR INDIA MAP) ===
router.get('/states', protect, async (req, res) => {
  try {
    const pipeline = [
      { $match: { state: { $exists: true, $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$state',
          logins: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          logins: 1,
          _id: 0
        }
      },
      { $sort: { logins: -1 } }
    ];

    const stats = await User.aggregate(pipeline);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching state stats:', error);
    res.status(500).json({ error: 'Failed to fetch state stats' });
  }
});

module.exports = router;