/**
 * Database connection module for HorizonTrader
 * Uses MongoDB with Mongoose for data persistence
 */

const mongoose = require('mongoose');
const config = require('../../config/config');

let isConnected = false;

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
async function connectDB() {
  if (isConnected) {
    console.log('Database already connected');
    return;
  }

  try {
    const mongoURI = config.database?.mongoURI || process.env.MONGODB_URI || 'mongodb://localhost:27017/horizontrader';
    
    const options = config.database?.options || {
      // Modern MongoDB driver doesn't need these options (deprecated in v4.0.0+)
    };

    await mongoose.connect(mongoURI, options);
    
    isConnected = true;
    console.log(`✅ MongoDB connected: ${mongoURI.replace(/\/\/.*@/, '//***@')}`); // Hide credentials in logs
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    isConnected = false;
    
    // If database is not available, app can still run with in-memory storage
    if (config.database?.required !== false) {
      throw error;
    } else {
      console.log('⚠️  Continuing with in-memory storage (database optional)');
    }
  }
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
}

/**
 * Check if database is connected
 * @returns {boolean}
 */
function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get database connection status
 * @returns {string}
 */
function getDBStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

module.exports = {
  connectDB,
  disconnectDB,
  isDBConnected,
  getDBStatus,
  mongoose
};

