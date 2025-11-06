// createAdminUser.js
require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const admin = await AdminUser.findOne({ email: 'admin@dolchem.com' });
    if (admin) {
      console.log('Admin already exists');
      process.exit();
    }

    const newAdmin = new AdminUser({
      name: 'Mukul',
      lastName: 'Poonia',
      email: 'admin@dolchem.com',
      password: 'admin123'
    });

    await newAdmin.save();
    console.log('Admin created: admin@dolchem.com / admin123');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();