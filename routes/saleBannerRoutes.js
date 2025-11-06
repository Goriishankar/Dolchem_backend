const express = require('express');
const router = express.Router();
const SaleBanner = require('../models/SaleBanner');
const path = require('path');
const fs = require('fs');
const { upload } = require('../server'); 

// GET all
router.get('/', async (req, res) => {
    try {
        const saleBanners = await SaleBanner.find();
        res.json(saleBanners);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST - single image
router.post('/', upload.single('image'), async (req, res) => {
    try {
        console.log("POST - req.file:", req.file);
        console.log("POST - req.body:", req.body);

        const saleBanner = new SaleBanner({
            discount: req.body.discount,
            bannerTitle: req.body.bannerTitle,
            buttonText: req.body.buttonText,
            description: req.body.description,
            image: req.file ? req.file.filename : ''
        });
        const newSaleBanner = await saleBanner.save();
        res.status(201).json(newSaleBanner);
    } catch (err) {
        console.error("Create error:", err);
        res.status(400).json({ message: err.message });
    }
});

// PUT - single image
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        console.log("PUT - req.file:", req.file);
        console.log("PUT - req.body:", req.body);

        const updateData = {
            discount: req.body.discount,
            bannerTitle: req.body.bannerTitle,
            buttonText: req.body.buttonText,
            description: req.body.description
        };

        const existing = await SaleBanner.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Not found' });

        // Delete requested image
        if (req.body.deletedImage) {
            const delPath = path.join(__dirname, '../Uploads/sale-banners', req.body.deletedImage);
            if (fs.existsSync(delPath)) fs.unlinkSync(delPath);
            updateData.image = '';
        } else {
            updateData.image = existing.image;
        }

        // New image
        if (req.file) {
            if (existing.image) {
                const oldPath = path.join(__dirname, '../Uploads/sale-banners', existing.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.image = req.file.filename;
        }

        const updated = await SaleBanner.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updated);
    } catch (err) {
        console.error("Edit error:", err);
        res.status(400).json({ message: err.message });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const banner = await SaleBanner.findById(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Not found' });

        if (banner.image) {
            const imgPath = path.join(__dirname, '../Uploads/sale-banners', banner.image);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }

        await SaleBanner.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;