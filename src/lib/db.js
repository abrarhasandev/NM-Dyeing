import mongoose from "mongoose";

// Increase libuv threadpool size to prevent DNS and crypto bottlenecks (e.g., bcrypt, Atlas DNS lookups)
if (typeof process !== "undefined") {
  process.env.UV_THREADPOOL_SIZE = "128";
}

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Use globalThis to cache connection across module re-evaluations in Next.js dev server
let cached = globalThis.mongoose;

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // 1. Fast-path: Check if mongoose default connection is already established
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 2. Fast-path: Check if mongoose default connection is currently connecting
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => {
      mongoose.connection.once("connected", resolve);
    });
    return mongoose.connection;
  }

  // 3. Fallback: Check local module cache
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "garments_db",
        // Optimize pool size to avoid opening too many concurrent connections during parallel API requests
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      .then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;

