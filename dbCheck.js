const mongoose = require("mongoose");
const User = require("./models/User");
const Doctor = require("./models/Doctor");
const Queue = require("./models/Queue");
require("dotenv").config();

// Force Google DNS
require('dns').setDefaultResultOrder('ipv4first');
require('dns').setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully");

    const users = await User.find({ role: { $in: ["doctor", "superadmin"] } }).select("-password");
    console.log("\n=== DOCTOR & ADMIN USERS ===");
    console.log(JSON.stringify(users, null, 2));

    const doctors = await Doctor.find({});
    console.log("\n=== DOCTORS IN SYSTEM ===");
    console.log(JSON.stringify(doctors, null, 2));

    const queues = await Queue.find({}).populate("user", "name email").sort({ createdAt: -1 }).limit(10);
    console.log("\n=== RECENT QUEUE ENTRIES (LAST 10) ===");
    console.log(JSON.stringify(queues, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error inspecting database:", error.message);
  }
}

checkDb();
