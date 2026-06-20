const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────
//  connectDB
//  Connects our Express app to MongoDB using Mongoose.
//  Called once when the server starts in server.js
//  Note: useNewUrlParser & useUnifiedTopology options
//  were removed in Mongoose v8 — no longer needed
// ─────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database Name   : ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);

    // Exit the process with failure code
    // This stops the server if DB is not reachable
    process.exit(1);
  }
};

module.exports = connectDB;