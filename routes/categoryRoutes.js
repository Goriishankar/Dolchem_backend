// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const { upload } = require('../server'); 


router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ category: category._id });
        return {
          _id: category._id,
          projectName: category.projectName,
          image: category.image ? `${req.protocol}://${req.get('host')}/uploads/categories/${category.image}` : null,
          quantity: productCount,
        };
      })
    );
    console.log(`[API /categories] Returning ${categoriesWithCount.length} categories`);
    res.json(categoriesWithCount);
  } catch (err) {
    console.error(`[API /categories] Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});


router.post('/', upload.single('image'), async (req, res) => {
  console.log('[API /categories POST] Received body:', req.body);
  console.log('[API /categories POST] Received file:', req.file);

  try {
    if (!req.body.projectName) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = new Category({
      projectName: req.body.projectName,
      image: req.file ? req.file.filename : null,
    });

    const newCategory = await category.save();
    console.log(`[API /categories POST] Created category: ${newCategory._id}`);

    res.status(201).json({
      _id: newCategory._id,
      projectName: newCategory.projectName,
      image: newCategory.image ? `${req.protocol}://${req.get('host')}/uploads/categories/${newCategory.image}` : null,
    });
  } catch (err) {
    console.error(`[API /categories POST] Error: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
});


router.put('/:id', upload.single('image'), async (req, res) => {
  console.log('[API /categories PUT] Received body:', req.body);
  console.log('[API /categories PUT] Received file:', req.file);

  try {
    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updateData = {
      projectName: req.body.projectName || existingCategory.projectName,
      image: existingCategory.image,
    };


    if (req.body.deletedImage && existingCategory.image) {
      const imagePath = path.join(__dirname, '../Uploads/categories', existingCategory.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`[API] Deleted old image: ${existingCategory.image}`);
      }
      updateData.image = null;
    }


    if (req.file) {
      if (existingCategory.image) {
        const oldImagePath = path.join(__dirname, '../Uploads/categories', existingCategory.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`[API] Replaced old image: ${existingCategory.image}`);
        }
      }
      updateData.image = req.file.filename;
    }

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json({
      _id: updatedCategory._id,
      projectName: updatedCategory.projectName,
      image: updatedCategory.image ? `${req.protocol}://${req.get('host')}/uploads/categories/${updatedCategory.image}` : null,
    });
  } catch (err) {
    console.error(`[API /categories PUT] Error: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
});

// DELETE category by ID
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.image) {
      const imagePath = path.join(__dirname, '../Uploads/categories', category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`[API] Deleted image on delete: ${category.image}`);
      }
    }

    await Category.findByIdAndDelete(req.params.id);
    console.log(`[API /categories DELETE] Deleted category: ${req.params.id}`);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(`[API /categories DELETE] Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;