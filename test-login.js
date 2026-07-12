import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const userSchema = new mongoose.Schema({
    password: { type: String },
  });
  
const User = mongoose.models.User || mongoose.model("User", userSchema);

async function testLogin() {
    console.time("connectDB");
    await mongoose.connect(process.env.MONGO_URI, { dbName: "garments_db" });
    console.timeEnd("connectDB");

    console.time("findOne");
    const user = await User.findOne({ email: "admin@gmail.com" }).lean();
    console.timeEnd("findOne");

    if (user && user.password) {
        console.time("bcrypt");
        await bcrypt.compare("12345678", user.password);
        console.timeEnd("bcrypt");
    }

    mongoose.disconnect();
}
testLogin();
