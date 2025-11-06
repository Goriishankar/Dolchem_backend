// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const admin = require('firebase-admin');
const http = require('http');
const { Server } = require('socket.io');

// === GLOBAL IO ===
let io;

// === MULTER CONFIG ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'Uploads';
    if (req.body.saveToProduct === 'true') dir = 'Uploads/products';
    else if (req.body.saveToCategory === 'true') dir = 'Uploads/categories';
    else if (req.body.saveToBanner === 'true') dir = 'Uploads/Banner';
    else if (req.body.saveToSaleBanner === 'true') dir = 'Uploads/sale-banners';
    else if (req.body.saveToProfile === 'true') dir = 'Uploads/profiles';
    
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// === EXPORT UPLOAD ===
module.exports.upload = upload;

// === IMPORT ROUTES ===
const categoryRoutes = require('./routes/categoryRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const saleBannerRoutes = require('./routes/saleBannerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const statsRoutes = require('./routes/statsRoutes');
const authAdminRoutes = require('./routes/authAdminRoutes');




// === FIREBASE ===
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const app = express();

// === MIDDLEWARE ===
app.use(cors({
  origin: true, 
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// === ROUTES ===
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/sale-banners', saleBannerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/user/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authAdminRoutes);

// === SOCKET.IO SETUP ===
const server = http.createServer(app);
io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.set('io', io);
global.io = io;

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// === MONGODB CONNECT ===
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB error:', err);
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// === START SERVER ===
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});