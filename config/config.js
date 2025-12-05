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
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // Express Server Configuration
  express: {
    // CORS settings
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    },
    // Rate limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      authWindowMs: 15 * 60 * 1000, // 15 minutes for auth
      authMaxRequests: 5 // 5 login attempts per window
    },
    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
    },
    // Body parser limits
    bodyLimit: '10mb'
  },

  // Trading Configuration
  trading: {
    // Commission and fees
    commission: parseFloat(process.env.TRADING_COMMISSION) || 0, // Per trade commission (default: $0 for demo)
    commissionPercent: parseFloat(process.env.TRADING_COMMISSION_PERCENT) || 0.001, // 0.1% commission (alternative)
    slippage: 0.0005,   // 0.05% slippage per trade
    
    // Wallet settings
    initialCapital: parseFloat(process.env.INITIAL_CAPITAL) || 10000, // $10,000 starting capital (changed from $100,000)
    minBalance: 0,      // Minimum wallet balance
    maxDeposit: 1000000, // Maximum single deposit
    
    // Position limits
    maxPositions: 20,   // Maximum positions in portfolio
    minSharesPerTrade: 1, // Minimum shares per trade
    maxSharesPerTrade: 10000, // Maximum shares per trade
    minTradeValue: 1,   // Minimum trade value in dollars
    maxTradeValue: 1000000, // Maximum trade value in dollars
    
    // Risk management
    maxPositionSize: 0.20, // Max 20% of portfolio in single position
    maxPortfolioRisk: 0.02, // Max 2% risk per trade
    
    // Data requirements
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
  },

  // Gemini API Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || null,
    baseUrl: 'https://generativelanguage.googleapis.com/v1', // Using v1 API (v1beta is deprecated)
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', // Using gemini-2.5-flash (fast and efficient)
    timeout: parseInt(process.env.GEMINI_TIMEOUT) || 30000, // 30 seconds
    enabled: process.env.GEMINI_ENABLED !== 'false' // Enable by default if API key is present
  }
};






