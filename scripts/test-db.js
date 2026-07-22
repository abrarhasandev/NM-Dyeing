const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const doc = await db.collection('customers').findOne({ _id: require('mongodb').ObjectId("6918a608966bcab8fef02de8") });
  console.log("phoneNumber IS ARRAY?", Array.isArray(doc.phoneNumber));
  console.log("phoneNumber TYPE:", typeof doc.phoneNumber);
  console.log("phoneNumber VALUE:", JSON.stringify(doc.phoneNumber, null, 2));
  await client.close();
}
run();
