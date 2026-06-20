const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/user.model");
const Account = require("./models/account.model");
const { hashPassword } = require("./utils/passwordUtils");

// ─────────────────────────────────────────────────────
//  seeder.js
//  Creates a default admin account using values
//  from .env file.
//
//  This is a one-time setup script — run it once
//  after setting up a fresh database.
//
//  Usage:
//  node src/seeder.js
// ─────────────────────────────────────────────────────

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // ── Step 1: Check required env variables ──────────
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error("❌ Missing ADMIN_NAME, ADMIN_EMAIL or ADMIN_PASSWORD in .env");
      process.exit(1);
    }

    // ── Step 2: Check if admin already exists ──────────
    const existingAdmin = await User.findOne({
      email: ADMIN_EMAIL.toLowerCase(),
    });

    if (existingAdmin) {
      console.log("⚠️  Admin account already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role : ${existingAdmin.role}`);

      // If user exists but is not admin, promote them
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("✅ Existing user promoted to admin");
      }

      process.exit(0);
    }

    // ── Step 3: Create admin account ───────────────────
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    const admin = await User.create({
      name:             ADMIN_NAME,
      email:            ADMIN_EMAIL.toLowerCase(),
      phone:            "+8800000000000",
      password:         hashedPassword,
      role:             "admin",
      isActive:         true,
      isEmailVerified:  true, // admin doesn't need email verification
    });

    console.log("✅ Admin account created successfully");
    console.log(`   Name : ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role : ${admin.role}`);

    // ── Step 4: Create wallet for admin ────────────────
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);

    await Account.create({
      owner:          admin._id,
      balance:        0,
      minimumBalance: 200,
      accountNumber:  `TMS-${randomDigits}`,
    });

    console.log("✅ Admin wallet created");
    console.log("─────────────────────────────────────────");
    console.log("🔑 LOGIN CREDENTIALS");
    console.log(`   Email   : ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log("─────────────────────────────────────────");
    console.log("⚠️  Change this password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeder failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();