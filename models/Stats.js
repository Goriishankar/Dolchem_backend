// backend/models/Stats.js
const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  totalCustomers: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stats', statsSchema);