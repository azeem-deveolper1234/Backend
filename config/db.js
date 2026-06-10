require("dotenv").config();
const mongoose = require('mongoose');
const dns = require('dns').promises;

// Force Google DNS
require('dns').setDefaultResultOrder('ipv4first');
require('dns').setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/queue_management_system';
  const connectionTimeout = 8000; // 8 seconds timeout for primary connection

  // Manual DNS resolution check for Atlas
  try {
    const records = await dns.resolveSrv('_mongodb._tcp.cluster0.mec1oyr.mongodb.net');
    if (process.env.NODE_ENV !== 'production') {
      console.log('SRV Records:', records);
    }
  } catch (srvErr) {
    console.warn('Manual SRV resolution failed, mongoose will resolve primary itself:', srvErr.message);
  }

  try {
    console.log('Connecting to Primary MongoDB Atlas...');
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: connectionTimeout,
      family: 4
    });
    console.log('MongoDB Atlas Connected successfully');
  } catch (error) {
    console.warn(`Primary MongoDB Atlas connection failed: ${error.message}`);
    console.log('Attempting connection to Local Fallback MongoDB (Port 27017)...');
    
    try {
      await mongoose.disconnect();
    } catch (_) {}

    try {
      await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000,
        family: 4
      });
      console.log('Local Fallback MongoDB Connected successfully! (Port 27017)');
    } catch (localError) {
      console.error('All MongoDB connection attempts failed.');
      console.error('Local fallback connection failed with error:', localError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;