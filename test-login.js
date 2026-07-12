import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./src/models/User.js";

async function test() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.log("NO MONGO_URI"); return; }
  await mongoose.connect(uri);

  const email = "random@example.com";
  const password = "password123";

  const user = await User.findOne({ email }).select("+password name email role");
  
  if (!user) {
    console.log("User not found!");
  } else {
    console.log("User found:", user);
  }
  
  await mongoose.disconnect();
}

test();
