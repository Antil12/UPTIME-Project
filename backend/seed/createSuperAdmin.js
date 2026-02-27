#!/usr/bin/env node
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || `mongodb://${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@mongodb:27017/${process.env.MONGO_DATABASE}?authSource=admin`;

const name = process.env.SUPERADMIN_NAME || "Super Admin";
const email = process.env.SUPERADMIN_EMAIL || "admi1n@local";
const password = process.env.SUPERADMIN_PASSWORD || "admin123";

const connect = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGO_DATABASE || undefined });
    console.log("✅ Seeder connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
};

const run = async () => {
  await connect();

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role !== "SUPERADMIN") {
        existing.role = "SUPERADMIN";
        await existing.save();
        console.log(`Updated existing user ${email} to SUPERADMIN`);
      } else {
        console.log(`User ${email} already exists with SUPERADMIN role`);
      }
    } else {
      const user = new User({ name, email, password, role: "SUPERADMIN" });
      await user.save();
      console.log(`Created SUPERADMIN user ${email}`);
    }

    // Graceful exit
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeder error:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
