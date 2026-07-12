import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"] },
    email: { type: String, required: [true, "Email is required"], unique: true },
    password: { type: String },
    role: { type: String, default: "user", enum: ["admin", "user", "moderator"] },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function check() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "garments_db" });
  console.log("Connected to DB");
  
  const users = await User.find({}).lean();
  console.log("Total users:", users.length);
  
  for (const user of users) {
    console.log(`\nUser: ${user.email} (Role: ${user.role})`);
    console.log(`Password: ${user.password}`);
    if (user.password && !user.password.startsWith("$2")) {
      console.log("WARNING: Password is not hashed with bcrypt!");
    }
  }
  
  mongoose.disconnect();
}

check().catch(console.error);
