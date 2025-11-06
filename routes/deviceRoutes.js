const express = require('express');
const router = express.Router();
const Device = require('../models/Device');


router.post('/token', async (req, res) => {
  const { token } = req.body;
  try {
    await Device.findOneAndUpdate(
      { token },
      { token },
      { upsert: true, new: true }
    );
    console.log(`[API /devices/token] Token saved: ${token.substring(0,20)}...`);
    res.send('Token saved');
  } catch (err) {
    console.error('[API /devices/token] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;