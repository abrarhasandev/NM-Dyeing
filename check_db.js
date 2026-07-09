const mongoose = require('mongoose');
const Order = require('./src/models/Order');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nm-dyeing', { useNewUrlParser: true, useUnifiedTopology: true });
  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(2);
  console.log(recentOrders);
  process.exit();
}
check();
