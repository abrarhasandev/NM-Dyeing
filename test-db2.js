import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: { type: String },
    role: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function check() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "garments_db" });
  
  const user1 = await User.findOne({ email: "admin@gmail.com" }).select("password name email role");
  console.log("With +password name email role:", user1.password ? "Found" : "Undefined");
  
  const user2 = await User.findOne({ email: "admin@gmail.com" }).select("+password");
  console.log("With +password:", user2.password ? "Found" : "Undefined");

  const user3 = await User.findOne({ email: "admin@gmail.com" });
  console.log("Without select:", user3.password ? "Found" : "Undefined");

  mongoose.disconnect();
}

check().catch(console.error);
