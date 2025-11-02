/**
 * Configuration settings for HorizonTrader
 * Alpha Vantage API configuration and application settings
 */

module.exports = {
  // Alpha Vantage API Configuration
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'MN2S749NU20S4XMU', // Use demo key for testing
    baseUrl: 'https://www.alphavantage.co/query',
    rateLimit: {
      callsPerMinute: 5, // Free tier limit
      callsPerDay: 500,  // Free tier limit
      retryAfter: 60000  // 1 minute retry delay
    }
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
  }
};





