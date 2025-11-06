const mongoose = require('mongoose');
const bannerSchema = new mongoose.Schema({
    bannerTitle: {
        type: String,
        required: true
    },
    buttonName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: [{
        type: String,
        required: false
    }]
}, { timestamps: true });
const Banner = mongoose.model('Banner', bannerSchema);
module.exports = Banner;