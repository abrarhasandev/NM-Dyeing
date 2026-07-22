require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const Customer = require('./src/models/customers').default;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const c = await Customer.findById("6918a608966bcab8fef02de8");
  console.log("phoneNumber:", c.phoneNumber);
  console.log("address:", c.address);
  console.log("owners:", c.owners);
  process.exit(0);
}
run();
