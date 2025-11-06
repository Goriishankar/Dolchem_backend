// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Stats = require('../models/Stats');
const User = require('../models/User');
// const { protect } = require('../middleware/auth'); 


router.get('/stats/customers', async (req, res) => {  
  try {
    console.log('[API] /admin/stats/customers called (public now)');

    let stats = await Stats.findOne({}).lean();

    if (stats && stats.totalCustomers !== undefined) {
      console.log('[API] Stats found:', stats.totalCustomers);
      return res.json({ totalCustomers: stats.totalCustomers });
    }

    console.log('[API] Stats not found, falling back to User.countDocuments()');
    const totalFromUsers = await User.countDocuments({});
    console.log('[API] Total users from DB:', totalFromUsers);

    await Stats.findOneAndUpdate(
      {},
      { $set: { totalCustomers: totalFromUsers, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ totalCustomers: totalFromUsers });

  } catch (err) {
    console.error('[API /stats/customers] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;