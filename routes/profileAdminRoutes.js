// routes/profileAdminRoutes.js
const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const authAdmin = require('../middleware/authAdminMiddleware');

// GET /api/user/profile/admin
router.get('/admin', authAdmin, async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.admin.id).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.json({
      name: admin.name,
      lastName: admin.lastName,
      email: admin.email,
      profileImage: admin.profileImage
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;