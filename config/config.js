/**
 * Configuration settings for HorizonTrader
 * Alpha Vantage API configuration and application settings
 */

// Get API keys from environment variables
const getApiKeys = () => {
  const keys = [];
  
  // Primary key (required)
  if (process.env.ALPHA_VANTAGE_API_KEY) {
    keys.push(process.env.ALPHA_VANTAGE_API_KEY);
  }
  
  // Secondary key (optional)
  if (process.env.ALPHA_VANTAGE_API_KEY_2) {
    keys.push(process.env.ALPHA_VANTAGE_API_KEY_2);
  }
  
  // Tertiary key (optional)
  if (process.env.ALPHA_VANTAGE_API_KEY_3) {
    keys.push(process.env.ALPHA_VANTAGE_API_KEY_3);
  }
  
  // Fallback to demo key if no keys provided (for testing only)
  if (keys.length === 0) {
    keys.push('MN2S749NU20S4XMU');
  }
  
  return keys;
};

module.exports = {
  // Alpha Vantage API Configuration
  alphaVantage: {
    apiKeys: getApiKeys(), // Array of API keys for rotation
    apiKey: getApiKeys()[0], // Primary key (backward compatibility)
    baseUrl: 'https://www.alphavantage.co/query',
    rateLimit: {
      callsPerMinute: 5, // Free tier limit
      callsPerDay: 500,  // Free tier limit
      retryAfter: 60000  // 1 minute retry delay
    },
    enableKeyRotation: process.env.ENABLE_KEY_ROTATION !== 'false' // Enable by default
  },

  // Application Settings
  app: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // Trading Configuration
  trading: {
    commission: 0.001,  // 0.1% commission per trade
    slippage: 0.0005,   // 0.05% slippage per trade
    initialCapital: 100000, // $100,000 starting capital
    maxPositions: 20,   // Maximum positions in portfolio
    minDataPoints: 50   // Minimum data points for indicators
  },

  // Cache Configuration
  cache: {
    historicalDataTTL: 24 * 60 * 60 * 1000, // 24 hours
    realTimeDataTTL: 5 * 60 * 1000,         // 5 minutes
    cacheDir: './cache'
  },

  // Backtesting Configuration
  backtest: {
    defaultStartDate: '2019-01-01',
    defaultEndDate: '2024-01-01',
    benchmark: 'SPY' // S&P 500 as default benchmark
  },

  // Paper Trading Configuration
  paperTrading: {
    updateInterval: 5 * 60 * 1000, // 5 minutes
    maxDeviation: 0.10 // 10% performance deviation alert
  },

  // Database Configuration
  database: {
    mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/horizontrader',
    required: process.env.DB_REQUIRED !== 'true', // Set to true to require DB, false to make it optional
    options: {
      // Modern MongoDB driver options (useNewUrlParser and useUnifiedTopology are deprecated)
    }
  }
};






