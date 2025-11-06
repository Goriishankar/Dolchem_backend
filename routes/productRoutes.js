// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// === IMPORT MULTER FROM SERVER ===
const { upload } = require('../server'); 

// GET count
router.get('/count', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    res.json({ totalProducts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all
router.get('/', async (req, res) => {
  try {
    let products;
    if (req.query.category) {
      const cat = await Category.findOne({ projectName: req.query.category });
      if (!cat) return res.status(404).json({ message: 'Category not found' });
      products = await Product.find({ category: cat._id }).populate('category', 'projectName');
    } else {
      products = await Product.find().populate('category', 'projectName');
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - CREATE PRODUCT
router.post('/', upload.array('images', 4), async (req, res) => {
  try {
    console.log('Incoming product data:', req.body);
    console.log('Files:', req.files);

    const images = req.files ? req.files.map(file => file.filename) : [];

    // === Resolve category ID ===
    let categoryId;
    if (req.body.category) {
      if (/^[0-9a-fA-F]{24}$/.test(req.body.category)) {
        categoryId = req.body.category;
      } else {
        const cat = await Category.findOne({ projectName: req.body.category });
        if (!cat) return res.status(400).json({ message: 'Invalid category name' });
        categoryId = cat._id;
      }
    } else {
      return res.status(400).json({ message: 'Category is required' });
    }

    // === Create Product ===
    const product = new Product({
      productName: req.body.productName,
      description: req.body.description,
      category: categoryId,
      price: Number(req.body.price),
      discount: Number(req.body.discount) || 0,
      images
    });

    const savedProduct = await product.save();
    console.log('Product saved:', savedProduct._id);

    // === Save Notification in DB ===
    await Notification.create({
      title: 'New Product Added!',
      body: `${savedProduct.productName} is now available!`,
      product: savedProduct._id
    });

    // === FCM PUSH ===
    const finalPrice = savedProduct.price - (savedProduct.price * savedProduct.discount) / 100;

    const message = {
      topic: 'new_products',
      notification: {
        title: 'New Product!',
        body: `${savedProduct.productName} - ₹${finalPrice.toFixed(2)}`,
      },
      data: {
        productId: savedProduct._id.toString(),
        type: 'new_product',
        screen: 'Notifications'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            'content-available': 1
          }
        }
      }
    };

    admin.messaging().send(message)
      .then(() => console.log('FCM sent successfully'))
      .catch(err => console.error('FCM send error:', err.message));

    // === Populate for response ===
    const populated = await Product.findById(savedProduct._id).populate('category', 'projectName');

    // === LIVE COUNT UPDATE ===
    const count = await Product.countDocuments();
    if (global.io) {
      global.io.emit('productCountUpdate', count);
      console.log('[LIVE] Product count ADD:', count);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error('Product add error:', err);
    res.status(400).json({ message: err.message || 'Failed to add product' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.images.forEach(img => {
      const filePath = path.join(__dirname, '../Uploads/products', img);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await Product.findByIdAndDelete(req.params.id);

    const count = await Product.countDocuments();
    if (global.io) {
      global.io.emit('productCountUpdate', count);
      console.log('[LIVE] Product count DELETE:', count);
    }

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.put('/:id', upload.array('images', 4), async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    let images = existing.images || [];


    if (req.body.deletedImages) {
      const deleted = JSON.parse(req.body.deletedImages);
      deleted.forEach(img => {
        const filePath = path.join(__dirname, '../Uploads/products', img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
      images = images.filter(img => !deleted.includes(img));
    }


    if (req.files && req.files.length > 0) {
      images = [...images, ...req.files.map(f => f.filename)];
    }


    let categoryId = existing.category;
    if (req.body.category) {
      if (/^[0-9a-fA-F]{24}$/.test(req.body.category)) {
        categoryId = req.body.category;
      } else {
        const cat = await Category.findOne({ projectName: req.body.category });
        if (!cat) return res.status(400).json({ message: 'Invalid category' });
        categoryId = cat._id;
      }
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        productName: req.body.productName,
        description: req.body.description,
        category: categoryId,
        price: Number(req.body.price),
        discount: Number(req.body.discount) || 0,
        images
      },
      { new: true }
    ).populate('category', 'projectName');


    const finalPrice = updated.price - (updated.price * updated.discount) / 100;
    admin.messaging().send({
      topic: 'new_products',
      notification: {
        title: 'Product Updated!',
        body: `${updated.productName} - ₹${finalPrice.toFixed(2)}`
      },
      data: { productId: updated._id.toString() }
    }).catch(() => {});

    // === LIVE COUNT UPDATE ===
    const count = await Product.countDocuments();
    if (global.io) {
      global.io.emit('productCountUpdate', count);
    }

    res.json(updated);
  } catch (err) {
    console.error('Product update error:', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;