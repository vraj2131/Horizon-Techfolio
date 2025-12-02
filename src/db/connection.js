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
    
    // Debug: Log which URI source is being used (without exposing credentials)
    if (process.env.MONGODB_URI) {
      console.log('📝 Using MONGODB_URI from environment variable');
      const maskedURI = process.env.MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://$1:***@');
      console.log(`📝 Connection string: ${maskedURI}`);
    } else if (config.database?.mongoURI) {
      console.log('📝 Using MONGODB_URI from config file');
    } else {
      console.log('⚠️  MONGODB_URI not found - using fallback localhost connection');
      console.log('⚠️  Please set MONGODB_URI in your .env file with your MongoDB Atlas connection string');
    }
    
    const options = {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      ...(config.database?.options || {})
    };

    // Use Promise.race to add a timeout
    const connectPromise = mongoose.connect(mongoURI, options);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout after 5 seconds')), 5000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    
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
    // Don't throw error - allow server to start without DB
    console.log('⚠️  Continuing without database (some features may be limited)');
    console.log('⚠️  To fix MongoDB connection: Check IP whitelist in MongoDB Atlas');
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

