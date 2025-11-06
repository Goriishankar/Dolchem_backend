const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Stats = require('../models/Stats');
const jwt = require('jsonwebtoken');

// ------------------------------------------------------------------
// SIGNUP – Create user + state + increment totalCustomers + LIVE UPDATE
// ------------------------------------------------------------------
router.post('/signup', async (req, res) => {
  const { firstName, lastName, phoneNumber, uid, state } = req.body;

  if (!firstName || !lastName || !phoneNumber) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    const existing = await User.findOne({ phoneNumber });
    if (existing) {
      return res.status(400).json({ message: 'User exists' });
    }

    const user = new User({ 
      firstName, 
      lastName, 
      phoneNumber, 
      uid, 
      state 
    });
    await user.save();

    await Stats.findOneAndUpdate(
      {},
      { $inc: { totalCustomers: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    if (global.io) {
      const stats = await Stats.findOne({}).lean();
      const totalCustomers = stats?.totalCustomers || 0;
      global.io.emit('customerCountUpdate', { totalCustomers });
    }

    const { wishlist, ...userWithoutSensitive } = user.toObject();
    res.status(201).json({ message: 'User created', user: userWithoutSensitive });
  } catch (err) {
    console.error('[authRoutes] Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------------
// LOGIN – Return token + update state if sent + LIVE UPDATE + STATE EMIT
// ------------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { phoneNumber, state } = req.body;

  try {
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    if (state && state.trim() && state !== user.state) {
      user.state = state.trim();
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    if (global.io) {
      const stats = await Stats.findOne({}).lean();
      const totalCustomers = stats?.totalCustomers || 0;
      global.io.emit('customerCountUpdate', { totalCustomers });


      if (user.state && user.state.trim()) {
        global.io.emit('userLogin', { state: user.state.trim() });
      }

    }

    const { wishlist, ...safeUser } = user.toObject();
    res.json({
      message: 'Login success',
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error('[authRoutes] Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------------
// UPDATE NAME
// ------------------------------------------------------------------
router.put('/updateProfile', async (req, res) => {
  const { userId, firstName, lastName } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId required' });

  try {
    const update = {};
    if (firstName) update.firstName = firstName;
    if (lastName) update.lastName = lastName;

    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { wishlist, ...safeUser } = user.toObject();
    res.json({ message: 'Name updated', user: safeUser });
  } catch (err) {
    console.error('[authRoutes] Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------------
// UPDATE PHONE
// ------------------------------------------------------------------
router.put('/updatePhone', async (req, res) => {
  const { userId, newPhoneNumber } = req.body;
  if (!userId || !newPhoneNumber) {
    return res.status(400).json({ message: 'userId and newPhoneNumber required' });
  }

  try {
    const existing = await User.findOne({ phoneNumber: newPhoneNumber });
    if (existing && existing._id.toString() !== userId) {
      return res.status(400).json({ message: 'Phone number already in use' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { phoneNumber: newPhoneNumber },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    const { wishlist, ...safeUser } = user.toObject();
    res.json({ message: 'Phone updated', user: safeUser });
  } catch (err) {
    console.error('[authRoutes] Update phone error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;