// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  images: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);