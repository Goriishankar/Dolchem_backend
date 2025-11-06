// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;