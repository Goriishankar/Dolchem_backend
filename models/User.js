// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  uid: { type: String, unique: true, sparse: true },
  profileImage: { 
    type: String, 
    default: '/uploads/profile/default.png' 
  },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdAt: { type: Date, default: Date.now },

  state: { type: String, trim: true } 
});

module.exports = mongoose.model('User', userSchema);