// backend/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// === MULTER CONFIG ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'Uploads/profile';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const userId = req.userId; 
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (types.test(ext)) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// === UPLOAD PROFILE IMAGE ===
router.post('/upload', protect, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newImagePath = `/uploads/profile/${req.file.filename}`;


    if (user.profileImage && user.profileImage !== '/uploads/profile/default.png') {
      const oldPath = path.join(__dirname, '..', user.profileImage.replace('/uploads', 'Uploads'));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profileImage = newImagePath;
    await user.save();

    const { cart, ...safeUser } = user.toObject();
    res.json({ message: 'Profile image updated', user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// === DELETE PROFILE IMAGE ===
router.delete('/delete', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.profileImage && user.profileImage !== '/uploads/profile/default.png') {
      const oldPath = path.join(__dirname, '..', user.profileImage.replace('/uploads', 'Uploads'));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profileImage = '/uploads/profile/default.png';
    await user.save();

    const { cart, ...safeUser } = user.toObject();
    res.json({ message: 'Profile image removed', user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

// === GET USER PROFILE ===
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-cart');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;