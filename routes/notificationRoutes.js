// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Fetch notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .populate('product')
      .sort({ createdAt: -1 });
    console.log(`[API /notifications] Fetched ${notifications.length} notifications`);
    res.json(notifications);
  } catch (err) {
    console.error(`[API /notifications] Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    console.log(`[API /notifications/:id] Deleted notification: ${req.params.id}`);
    res.send('Deleted');
  } catch (err) {
    console.error(`[API /notifications/:id] Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

// Clear all notifications
router.delete('/clear', async (req, res) => {
  try {
    await Notification.deleteMany({});
    console.log(`[API /notifications/clear] Cleared all notifications`);
    res.send('All notifications cleared');
  } catch (err) {
    console.error(`[API /notifications/clear] Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;