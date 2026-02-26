require("dotenv").config();
const mongoose = require('mongoose');
const dns = require('dns').promises;

// Force Google DNS
require('dns').setDefaultResultOrder('ipv4first');
require('dns').setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const connectDB = async () => {
  try {
    // SRV manually resolve karo
    const records = await dns.resolveSrv('_mongodb._tcp.cluster0.mec1oyr.mongodb.net');
    console.log('SRV Records:', records);
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;