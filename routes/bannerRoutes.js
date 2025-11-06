// routes/bannerRoutes.js
const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const path = require('path');
const fs = require('fs');
const { upload } = require('../server'); 

// GET all banners
router.get('/', async (req, res) => {
    try {
        const banners = await Banner.find();
        res.json(banners);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new banner
router.post('/', upload.array('images', 4), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'At least one image required' });
        }
        const banner = new Banner({
            bannerTitle: req.body.bannerTitle,
            buttonName: req.body.buttonName,
            description: req.body.description,
            images: req.files.map(file => file.filename)
        });
        const newBanner = await banner.save();
        res.status(201).json(newBanner);
    } catch (err) {
        if (req.files) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '../Uploads/Banner', file.filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        }
        res.status(400).json({ message: err.message });
    }
});

// PUT edit banner
router.put('/:id', upload.array('images', 4), async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });

        let images = banner.images;

        if (req.body.deletedImages) {
            const deleted = JSON.parse(req.body.deletedImages);
            deleted.forEach(img => {
                const imgPath = path.join(__dirname, '../Uploads/Banner', img);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            });
            images = images.filter(img => !deleted.includes(img));
        }

        if (req.files && req.files.length > 0) {
            images = [...images, ...req.files.map(f => f.filename)];
        }

        if (images.length === 0) return res.status(400).json({ message: 'At least one image required' });
        if (images.length > 4) return res.status(400).json({ message: 'Maximum 4 images allowed' });

        const updated = await Banner.findByIdAndUpdate(req.params.id, {
            bannerTitle: req.body.bannerTitle,
            buttonName: req.body.buttonName,
            description: req.body.description,
            images
        }, { new: true });

        res.json(updated);
    } catch (err) {
        if (req.files) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '../Uploads/Banner', file.filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        }
        res.status(400).json({ message: err.message });
    }
});

// DELETE banner
router.delete('/:id', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });

        banner.images.forEach(img => {
            const imgPath = path.join(__dirname, '../Uploads/Banner', img);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        });

        await Banner.findByIdAndDelete(req.params.id);
        res.json({ message: 'Banner deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;