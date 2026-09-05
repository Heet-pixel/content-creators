const mongoose = require('mongoose');

// If a query runs before the DB connection is ready, fail it quickly
// with a clear error instead of hanging for mongoose's 10s default.
mongoose.set('bufferTimeoutMS', 5000);

module.exports = async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/conten';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
    console.log('[DB] MongoDB connected');
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message);
    console.error('[DB] The server will keep running, but nothing can be saved until MONGODB_URI is reachable.');
  }
};
