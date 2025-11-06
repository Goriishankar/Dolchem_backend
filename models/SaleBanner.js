const mongoose = require('mongoose');
const saleBannerSchema = new mongoose.Schema({
    discount: {
        type: Number,
        required: true
    },
    bannerTitle: {
        type: String,
        required: true
    },
    buttonText: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    }
}, { timestamps: true });
const SaleBanner = mongoose.model('SaleBanner', saleBannerSchema);
module.exports = SaleBanner;