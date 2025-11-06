// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// CREATE ORDER
router.post('/', protect, async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    if (!paymentMethod) return res.status(400).json({ message: 'Payment method required' });

    const cart = await Cart.findOne({ user: req.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    const orderItems = [];
    for (let cartItem of cart.items) {
      const product = cartItem.product;
      if (!product) continue;
      const finalPrice = product.price - (product.price * (product.discount || 0)) / 100;
      totalAmount += finalPrice * cartItem.quantity;
      orderItems.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: finalPrice
      });
    }

    const order = new Order({
      user: req.userId, 
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'card' ? 'completed' : 'pending'
    });
    await order.save();
    await order.populate('items.product');

    await Cart.updateOne({ user: req.userId }, { items: [] });


    const io = req.app.get('io');
    if (io && order.paymentStatus === 'completed') {
      io.emit('order:updated', { totalAmount: order.totalAmount });
      console.log(`New order emitted: ₹${order.totalAmount}`);
    }

    res.json({ message: 'Order created successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;