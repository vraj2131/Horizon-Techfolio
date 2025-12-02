/**
 * Route handlers for HorizonTrader API
 * Pure Node.js implementation without Express
 */

const Security = require('../models/Security');
const Portfolio = require('../models/Portfolio');
const Strategy = require('../models/Strategy');
const StrategyService = require('../services/StrategyService');
const TradingService = require('../services/TradingService');
const DBService = require('../db/dbService');
const PriceDataService = require('../services/PriceDataService');
const AuthService = require('../services/AuthService');
const dailyUpdateService = require('../services/DailyUpdateService');
const PriceDataModel = require('../db/models/PriceDataModel');
const { isDBConnected } = require('../db/connection');
const config = require('../../config/config');
// Note: BacktestSession, CoupledTrade, and PaperTradingService will be implemented in later phases

const strategyService = new StrategyService();
const priceDataService = new PriceDataService();
const tradingService = new TradingService();

/**
 * Initialize a new portfolio with tickers and horizon
 * POST /portfolio/initialize
 * Body: { tickers: [], horizon: 1|2|5, userId: string } - userId is REQUIRED and must exist in database
 */
async function initializePortfolio(body) {
  try {
    const { tickers, horizon, userId, portfolioName, initialCapital } = body;
    
    // Validate userId is provided
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('userId is required and must be a valid string');
    }

    // Validate userId exists in database
    const user = await DBService.getUser(userId);
    if (!user) {
      throw new Error(`User with userId "${userId}" not found. Please create the user first using POST /user`);
    }
    
    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      throw new Error('Tickers array is required');
    }
    
    if (!horizon || !['1', '2', '5'].includes(horizon.toString())) {
      throw new Error('Horizon must be 1, 2, or 5 years');
    }

    if (tickers.length > 20) {
      throw new Error('Maximum 20 tickers allowed');
    }

    console.log(`Initializing portfolio for user ${userId} with ${tickers.length} tickers for ${horizon}-year horizon`);

    // Validate all tickers
    // First, check database for existing data (faster and avoids API calls)
    const securities = [];
    const validationResults = [];

    // Known tickers list (for validation when API is rate limited)
    const knownTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'JNJ', 'V', 'WMT', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'BAC', 'XOM', 'CVX', 'NFLX'];

    for (const ticker of tickers) {
      const tickerUpper = ticker.toUpperCase();
      let isValid = false;
      let validationNote = '';
      
      try {
        const security = new Security(ticker);
        
        // Step 1: Check database first (fastest, no API calls)
        try {
          if (isDBConnected()) {
            const priceDataDoc = await PriceDataModel.findOne({ ticker: tickerUpper, interval: 'daily' });
            if (priceDataDoc && priceDataDoc.data && Array.isArray(priceDataDoc.data) && priceDataDoc.data.length > 0) {
              isValid = true;
              validationNote = `Database (${priceDataDoc.data.length} records)`;
              console.log(`✅ ${tickerUpper}: Validated via ${validationNote}`);
            } else {
              console.log(`ℹ️  ${tickerUpper}: Not found in database (doc exists: ${!!priceDataDoc})`);
            }
          } else {
            console.log(`ℹ️  ${tickerUpper}: Database not connected, skipping DB check`);
          }
        } catch (dbError) {
          console.log(`⚠️  Database check for ${tickerUpper} failed: ${dbError.message}`);
        }
        
        // Step 2: If not in database, check if it's a known ticker (avoids API calls when rate limited)
        if (!isValid && knownTickers.includes(tickerUpper)) {
          isValid = true;
          validationNote = 'Known ticker (from our 20-stock list)';
          console.log(`✅ ${tickerUpper}: Validated as ${validationNote}`);
        }
        
        // Step 3: If still not valid, try API validation (may fail if rate limited)
        if (!isValid) {
          try {
            isValid = await security.validate_symbol();
            if (isValid) {
              validationNote = 'API validation';
            }
          } catch (apiError) {
            // API failed - if it's a known ticker, we already validated it above
            // If not known, mark as invalid
            if (!knownTickers.includes(tickerUpper)) {
              console.log(`⚠️  ${tickerUpper}: API validation failed and not in known ticker list: ${apiError.message}`);
            }
          }
        }
        
        // Add to results
        if (isValid) {
          securities.push(security);
          validationResults.push({ ticker: tickerUpper, status: 'valid', note: validationNote });
        } else {
          validationResults.push({ ticker: tickerUpper, status: 'invalid', error: 'Symbol not found or not validated' });
        }
      } catch (error) {
        console.error(`Error validating ${tickerUpper}:`, error.message);
        validationResults.push({ ticker: tickerUpper, status: 'error', error: error.message });
      }
    }

    // Check if we have enough valid securities
    const validSecurities = securities.filter(s => s);
    if (validSecurities.length === 0) {
      console.error('Validation failed. Results:', JSON.stringify(validationResults, null, 2));
      throw new Error(`No valid tickers found. Validation results: ${JSON.stringify(validationResults)}`);
    }

    // Initialize price data for all valid tickers (background, non-blocking)
    const tickerSymbols = validSecurities.map(s => s.ticker);
    dailyUpdateService.initializeTickers(tickerSymbols).catch(err => {
      console.warn('Background data initialization error (non-critical):', err.message);
    });

    // Create portfolio with validated userId
    const portfolio = new Portfolio(validSecurities, parseInt(horizon), initialCapital || null);
    portfolio.name = portfolioName || null; // Store portfolio name if provided
    portfolio.initialCapital = initialCapital || portfolio.cash || null; // Track initial capital separately
    const portfolioId = `portfolio_${Date.now()}`;
    await DBService.savePortfolio(portfolioId, portfolio, userId);

    console.log(`Portfolio ${portfolioId} created with ${validSecurities.length} valid securities`);

    return {
      portfolioId,
      userId: userId,
      name: portfolioName || null,
      horizon: parseInt(horizon),
      securities: validSecurities.map(s => s.get_metadata()),
      validationResults,
      message: `Portfolio initialized with ${validSecurities.length} valid securities for user ${userId}`
    };
  } catch (error) {
    console.error('Portfolio initialization error:', error.message);
    throw error;
  }
}

/**
 * Get current buy/hold/sell signals for a portfolio
 * GET /portfolio/:id/signals
 */
async function getPortfolioSignals(portfolioId) {
  try {
    const portfolio = await DBService.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    console.log(`Getting signals for portfolio ${portfolioId}`);
    
    // Get recommended strategy
    const recommendation = strategyService.recommendStrategy({
      horizon: portfolio.horizon,
      riskTolerance: 'medium',
      portfolioSize: portfolio.getTickers().length
    });
    
    const strategy = recommendation.strategyObject;
    
    // Fetch current price data for all securities (using PriceDataService for efficient caching)
    const priceDataMap = new Map();
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1); // Get last year of data for indicators
    const startDateStr = startDate.toISOString().split('T')[0];
    
    for (const ticker of portfolio.getTickers()) {
      const position = portfolio.getPosition(ticker);
      if (position) {
        try {
          // Use PriceDataService which checks DB first, then cache, then API
          const priceData = await priceDataService.getPriceData(ticker, startDateStr, endDate, 'daily');
          if (priceData && priceData.length > 0) {
            priceDataMap.set(ticker, priceData);
          } else {
            console.warn(`No price data available for ${ticker}`);
          }
        } catch (error) {
          console.warn(`Failed to fetch data for ${ticker}:`, error.message);
        }
      }
    }
    
    // Generate signals
    const signals = strategy.generate_signals(priceDataMap);
    
    // Ensure all tickers have signals (add default for missing data)
    const allTickers = portfolio.getTickers();
    const signalArray = Array.from(signals.values());
    
    // Add default signals for tickers without price data
    for (const ticker of allTickers) {
      const hasSignal = signalArray.some(s => s.ticker === ticker);
      if (!hasSignal) {
        signalArray.push({
          ticker,
          signal: 'hold',
          confidence: 0,
          strength: 'N/A',
          price: null,
          reason: 'Insufficient price data to generate signal',
          indicators: {},
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return {
      portfolioId,
      strategy: recommendation.strategy,
      signals: signalArray,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Get signals error:', error.message);
    throw error;
  }
}

/**
 * Get recommended strategy and trading frequency for a portfolio
 * GET /portfolio/:id/strategy
 */
async function getPortfolioStrategy(portfolioId) {
  try {
    const portfolio = await DBService.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    console.log(`Getting strategy for portfolio ${portfolioId}`);
    
    // Get recommended strategy
    const recommendation = strategyService.recommendStrategy({
      horizon: portfolio.horizon,
      riskTolerance: 'medium',
      portfolioSize: portfolio.getTickers().length
    });
    
    const strategy = recommendation.strategyObject;
    const explanation = strategy.explain();
    
    return {
      portfolioId,
      strategy: {
        name: explanation.name || strategy.name,
        description: explanation.description || strategy.getStrategyDescription(),
        frequency: explanation.frequency || recommendation.frequency || strategy.rebalance_freq,
        indicators: explanation.indicators ? explanation.indicators.map(ind => ind.type) : strategy.indicators.map(ind => ind.type),
        confidence: recommendation.confidence
      },
      recommendation: recommendation.reasoning,
      reasoning: recommendation.reasoning,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Get strategy error:', error.message);
    throw error;
  }
}

/**
 * Run historical backtest
 * POST /backtest
 */
async function runBacktest(body) {
  try {
    const { portfolioId, startDate, endDate, strategy } = body;
    
    if (!portfolioId) {
      throw new Error('Portfolio ID is required');
    }

    const portfolio = await DBService.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    console.log(`Running backtest for portfolio ${portfolioId}`);
    
    // This will be implemented in Phase 5 (Backtesting)
    // For now, return a placeholder
    const sessionId = `backtest_${Date.now()}`;
    await DBService.saveBacktestSession(sessionId, {
      portfolioId,
      startDate: startDate || '2020-01-01',
      endDate: endDate || '2023-12-31',
      status: 'completed',
      metrics: {
        cagr: 0.12,
        sharpe: 1.2,
        maxDrawdown: -0.15,
        totalReturn: 0.36
      }
    });

    return {
      sessionId,
      portfolioId,
      period: {
        start: startDate || '2020-01-01',
        end: endDate || '2023-12-31'
      },
      metrics: {
        cagr: 0.12, // Placeholder
        sharpe: 1.2, // Placeholder
        maxDrawdown: -0.15, // Placeholder
        totalReturn: 0.36 // Placeholder
      },
      message: 'Backtesting will be implemented in Phase 5 - placeholder response',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Backtest error:', error.message);
    throw error;
  }
}

/**
 * Get paper trading status for a portfolio
 * GET /portfolio/:id/paper-trading
 */
async function getPaperTradingStatus(portfolioId) {
  try {
    const portfolio = await DBService.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    console.log(`Getting paper trading status for portfolio ${portfolioId}`);
    
    // This will be implemented in Phase 6 (Paper Trading)
    // Try to get existing session or return placeholder
    let session = await DBService.getPaperTradingSession(portfolioId);
    
    if (!session) {
      // Return placeholder if no session exists
      return {
      portfolioId,
      status: 'active',
      paperTrades: [],
      performance: {
        currentValue: 100000, // Placeholder
        totalReturn: 0.0,
        dailyReturn: 0.0
      },
      message: 'Paper trading will be implemented in Phase 6 - placeholder response',
      timestamp: new Date().toISOString()
      };
    }
    
    // Return actual session data
    return {
      portfolioId: session.portfolioId,
      status: session.status,
      paperTrades: session.paperTrades || [],
      performance: session.performance || {
        currentValue: session.currentValue || 100000,
        totalReturn: session.totalReturn || 0.0,
        dailyReturn: session.dailyReturn || 0.0
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Paper trading status error:', error.message);
    throw error;
  }
}

/**
 * Generate coupled trade recommendation
 * POST /coupled-trade
 */
async function generateCoupledTrade(body) {
  try {
    const { portfolioId, method = 'pairs' } = body;
    
    if (!portfolioId) {
      throw new Error('Portfolio ID is required');
    }

    const portfolio = await DBService.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    console.log(`Generating coupled trade for portfolio ${portfolioId}`);
    
    // This will be implemented in Phase 7 (Coupled Trades)
    // For now, return a placeholder
    return {
      portfolioId,
      method,
      legs: [],
      hedgeRatio: 1.0,
      riskScore: 0.5,
      message: 'Coupled trading will be implemented in Phase 7 - placeholder response',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Coupled trade error:', error.message);
    throw error;
  }
}

/**
 * Get portfolio performance metrics
 * GET /portfolio/:id/performance
 */
async function getPortfolioPerformance(portfolioId) {
  try {
    const portfolio = await DBService.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    console.log(`Getting performance for portfolio ${portfolioId}`);
    
    // This will be enhanced in Phase 4 (Portfolio Management)
    // For now, return basic performance data
    const performance = portfolio.performance();
    
    return {
      portfolioId,
      performance: {
        totalValue: performance.totalValue,
        totalReturn: performance.totalReturn,
        annualizedReturn: performance.annualizedReturn,
        cash: performance.cash,
        unrealizedPnl: performance.unrealizedPnl,
        horizon: performance.horizon
      },
      positions: Array.from(portfolio.positions.values()).map(p => ({
        ticker: p.security.ticker,
        shares: p.shares,
        avgCost: p.avg_cost,
        currentValue: p.getCostBasis(), // Current cost basis
        pnl: p.pnl_unrealized
      })),
      message: 'Basic performance tracking implemented - will be enhanced in Phase 4',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Performance error:', error.message);
    throw error;
  }
}

/**
 * Create or update a user
 * POST /user
 * Body: { userId: string, name: string, email?: string, password?: string }
 */
async function createUser(body) {
  try {
    const { userId, name, email, password } = body;
    
    if (!userId || !name) {
      throw new Error('userId and name are required');
    }

    // Validate password if provided
    if (password && password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    await DBService.saveUser(userId, name, email || null, password || null);
    
    // Automatically create wallet with default initial balance
    const initialBalance = config.trading?.initialCapital || 10000;
    try {
      await tradingService.getOrCreateWallet(userId, initialBalance);
      console.log(`✅ Wallet created for user ${userId} with $${initialBalance} initial balance`);
    } catch (walletError) {
      console.error(`⚠️  Failed to create wallet for user ${userId}:`, walletError.message);
      // Don't fail user creation if wallet creation fails
    }
    
    return {
      userId,
      name,
      email: email || null,
      initialBalance,
      message: password ? 'User created successfully with password' : 'User created successfully (no password set)'
    };
  } catch (error) {
    console.error('User creation error:', error.message);
    throw error;
  }
}

/**
 * Login user
 * POST /auth/login
 * Body: { userId: string, password: string }
 */
async function loginUser(body) {
  try {
    const { userId, password } = body;
    
    if (!userId || !password) {
      throw new Error('userId and password are required');
    }

    // Verify password
    const isValid = await DBService.verifyPassword(userId, password);
    
    if (!isValid) {
      throw new Error('Invalid userId or password');
    }

    // Get user details
    const user = await DBService.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate JWT token
    const token = AuthService.generateToken(user.userId, user.name);
    
    return {
      success: true,
      token,
      user: user.get_metadata(),
      message: 'Login successful'
    };
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

/**
 * Verify authentication token
 * POST /auth/verify
 * Body: { token: string } OR Headers: Authorization: Bearer <token>
 */
async function verifyAuth(req) {
  try {
    let decoded;
    
    // Try to get token from request body first
    if (req.body && req.body.token) {
      decoded = AuthService.verifyToken(req.body.token);
    } else {
      // Fall back to Authorization header
      decoded = AuthService.verifyRequest(req);
    }
    
    if (!decoded) {
      return {
        valid: false,
        authenticated: false,
        message: 'Invalid or missing token'
      };
    }

    // Get fresh user data
    const user = await DBService.getUser(decoded.userId);
    if (!user) {
      return {
        valid: false,
        authenticated: false,
        message: 'User not found'
      };
    }

    return {
      valid: true,
      authenticated: true,
      user: user.get_metadata()
    };
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return {
      valid: false,
      authenticated: false,
      message: error.message || 'Token verification failed'
    };
  }
}

/**
 * Get user information
 * GET /user/:userId
 */
async function getUser(userId) {
  try {
    const user = await DBService.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.get_metadata();
  } catch (error) {
    console.error('Get user error:', error.message);
    throw error;
  }
}

/**
 * Get all portfolios for a user
 * GET /user/:userId/portfolios
 */
async function getUserPortfolios(userId) {
  try {
    const portfolios = await DBService.getUserPortfolios(userId);
    
    return {
      userId,
      portfolios,
      count: portfolios.length,
      message: `Found ${portfolios.length} portfolio(s)`
    };
  } catch (error) {
    console.error('Get user portfolios error:', error.message);
    throw error;
  }
}

/**
 * Search/validate stock symbols
 * POST /stocks/search
 * Body: { symbols: string[] } - Array of symbols to validate
 * Returns: Array of valid symbols with metadata
 */
async function searchStocks(body) {
  try {
    const { symbols } = body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      throw new Error('symbols array is required');
    }

    if (symbols.length > 50) {
      throw new Error('Maximum 50 symbols per request');
    }

    console.log(`Validating ${symbols.length} stock symbols...`);
    
    const results = [];
    
    for (const symbol of symbols) {
      try {
        const security = new Security(symbol.toUpperCase());
        const isValid = await security.validate_symbol();
        
        if (isValid) {
          results.push({
            symbol: symbol.toUpperCase(),
            valid: true,
            metadata: security.get_metadata()
          });
        } else {
          results.push({
            symbol: symbol.toUpperCase(),
            valid: false,
            error: 'Symbol not found or invalid'
          });
        }
      } catch (error) {
        results.push({
          symbol: symbol.toUpperCase(),
          valid: false,
          error: error.message
        });
      }
    }

    const validCount = results.filter(r => r.valid).length;
    
    return {
      total: symbols.length,
      valid: validCount,
      invalid: symbols.length - validCount,
      results: results
    };
  } catch (error) {
    console.error('Stock search error:', error.message);
    throw error;
  }
}

/**
 * Get list of stocks available in database (with price data)
 * GET /stocks/available
 */
async function getAvailableStocks() {
  try {
    const { isDBConnected } = require('../db/connection');
    
    if (!isDBConnected()) {
      return {
        stocks: [],
        count: 0,
        note: 'Database not connected. Please check your connection.'
      };
    }

    // Get all tickers that have price data in the database
    const priceDataDocs = await PriceDataModel.find({ interval: 'daily' })
      .select('ticker lastDate totalDataPoints')
      .sort({ ticker: 1 });

    const stocks = priceDataDocs.map(doc => ({
      ticker: doc.ticker,
      lastDate: doc.lastDate,
      dataPoints: doc.totalDataPoints || 0,
      available: true
    }));

    return {
      stocks,
      count: stocks.length,
      note: stocks.length > 0 
        ? `Found ${stocks.length} stocks with historical data in database`
        : 'No stocks found in database. Run populate-db script to add data.'
    };
  } catch (error) {
    console.error('Error getting available stocks:', error.message);
    throw error;
  }
}

/**
 * Get watchlist with current prices and daily changes
 * GET /stocks/watchlist
 * Optimized: Only fetches last 2 data points per stock using MongoDB aggregation
 */
async function getWatchlist() {
  try {
    const { isDBConnected } = require('../db/connection');
    
    if (!isDBConnected()) {
      return {
        watchlist: [],
        count: 0,
        lastUpdated: null,
        note: 'Database not connected. Please check your connection.'
      };
    }

    // Use aggregation to get only the last 2 data points per ticker (much faster!)
    const priceDataDocs = await PriceDataModel.aggregate([
      { $match: { interval: 'daily' } },
      { $project: {
        ticker: 1,
        lastDate: 1,
        // Get only the last 2 elements from data array
        latestData: { $slice: ['$data', -1] },
        previousData: { $slice: ['$data', -2, 1] }
      }},
      { $sort: { ticker: 1 } }
    ]);

    const watchlist = [];

    for (const doc of priceDataDocs) {
      const latestData = doc.latestData && doc.latestData[0];
      const previousData = doc.previousData && doc.previousData[0];

      if (!latestData) {
        continue; // Skip if no latest data
      }

      // Use previousData if available, otherwise use latestData for both
      const prevClose = previousData ? parseFloat(previousData.close) : parseFloat(latestData.close);
      const currentPrice = parseFloat(latestData.close);
      const change = currentPrice - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      watchlist.push({
        ticker: doc.ticker,
        name: getStockName(doc.ticker),
        price: currentPrice,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume: latestData.volume ? parseInt(latestData.volume) : 0,
        high: parseFloat(latestData.high),
        low: parseFloat(latestData.low),
        open: parseFloat(latestData.open),
        date: latestData.date,
        previousClose: prevClose
      });
    }

    return {
      watchlist,
      count: watchlist.length,
      lastUpdated: watchlist.length > 0 ? watchlist[0].date : null,
      marketStatus: getMarketStatus()
    };
  } catch (error) {
    console.error('Error getting watchlist:', error.message);
    throw error;
  }
}

/**
 * Helper: Get stock company name
 */
function getStockName(ticker) {
  const names = {
    'AAPL': 'Apple Inc.',
    'AMZN': 'Amazon.com Inc.',
    'BAC': 'Bank of America Corp.',
    'CVX': 'Chevron Corporation',
    'DIS': 'The Walt Disney Company',
    'GOOGL': 'Alphabet Inc.',
    'HD': 'The Home Depot Inc.',
    'JNJ': 'Johnson & Johnson',
    'JPM': 'JPMorgan Chase & Co.',
    'MA': 'Mastercard Inc.',
    'META': 'Meta Platforms Inc.',
    'MSFT': 'Microsoft Corporation',
    'NFLX': 'Netflix Inc.',
    'NVDA': 'NVIDIA Corporation',
    'PG': 'Procter & Gamble Co.',
    'TSLA': 'Tesla Inc.',
    'UNH': 'UnitedHealth Group Inc.',
    'V': 'Visa Inc.',
    'WMT': 'Walmart Inc.',
    'XOM': 'Exxon Mobil Corporation'
  };
  return names[ticker] || ticker;
}

/**
 * Get stock details with historical data
 * GET /stocks/:ticker
 */
async function getStockDetails(ticker) {
  try {
    const { isDBConnected } = require('../db/connection');
    
    if (!isDBConnected()) {
      throw new Error('Database not connected');
    }

    const tickerUpper = ticker.toUpperCase();
    
    // Get price data from database
    const priceDataDoc = await PriceDataModel.findOne({ 
      ticker: tickerUpper, 
      interval: 'daily' 
    });

    if (!priceDataDoc || !priceDataDoc.data || priceDataDoc.data.length === 0) {
      throw new Error(`No price data found for ${tickerUpper}`);
    }

    // Get latest data point
    const latestData = priceDataDoc.data[priceDataDoc.data.length - 1];
    const previousData = priceDataDoc.data.length >= 2 
      ? priceDataDoc.data[priceDataDoc.data.length - 2] 
      : latestData;

    const currentPrice = parseFloat(latestData.close);
    const previousClose = parseFloat(previousData.close);
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Calculate 52-week high/low
    const prices = priceDataDoc.data.map(d => parseFloat(d.close));
    const high52w = Math.max(...prices);
    const low52w = Math.min(...prices);

    // Get last 30 days of data for chart
    const recentData = priceDataDoc.data.slice(-30).map(d => ({
      date: d.date,
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
      volume: d.volume ? parseInt(d.volume) : 0
    }));

    return {
      ticker: tickerUpper,
      name: getStockName(tickerUpper),
      currentPrice,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      previousClose,
      volume: latestData.volume ? parseInt(latestData.volume) : 0,
      high: parseFloat(latestData.high),
      low: parseFloat(latestData.low),
      open: parseFloat(latestData.open),
      high52w,
      low52w,
      date: latestData.date,
      lastUpdated: priceDataDoc.lastDate,
      historicalData: recentData,
      totalDataPoints: priceDataDoc.data.length
    };
  } catch (error) {
    console.error(`Error getting stock details for ${ticker}:`, error.message);
    throw error;
  }
}

/**
 * Get technical indicators for a single stock
 * GET /stocks/:ticker/indicators
 */
async function getStockIndicators(ticker) {
  try {
    const { isDBConnected } = require('../db/connection');
    const { IndicatorService } = require('../services/IndicatorService');
    const PriceDataService = require('../services/PriceDataService');
    
    if (!isDBConnected()) {
      throw new Error('Database not connected');
    }

    const tickerUpper = ticker.toUpperCase();
    
    // Get price data (last year for indicators)
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const priceDataService = new PriceDataService();
    const priceData = await priceDataService.getPriceData(tickerUpper, startDateStr, endDate, 'daily');
    
    if (!priceData || priceData.length === 0) {
      throw new Error(`No price data found for ${tickerUpper}`);
    }

    // Get latest price
    const latestPrice = priceData[priceData.length - 1].close;
    
    // Calculate all indicators with default parameters
    const indicators = {
      SMA: { window: 20 },
      EMA: { window: 12 },
      RSI: { window: 14, overbought: 70, oversold: 30 },
      MACD: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      BOLLINGER: { window: 20, multiplier: 2 }
    };

    const results = {};
    
    for (const [indicatorType, params] of Object.entries(indicators)) {
      try {
        const indicator = IndicatorService.createIndicator(indicatorType, params);
        const values = indicator.compute(priceData);
        const signals = indicator.getAllSignals();
        const metadata = indicator.getMetadata();
        
        // Get latest value and signal
        // Handle different indicator value structures to determine latestIndex
        let latestIndex = 0;
        if (indicatorType === 'MACD' && values.macdLine && Array.isArray(values.macdLine)) {
          latestIndex = values.macdLine.length > 0 ? values.macdLine.length - 1 : 0;
        } else if (indicatorType === 'BOLLINGER' && values.upper && Array.isArray(values.upper)) {
          latestIndex = values.upper.length > 0 ? values.upper.length - 1 : 0;
        } else if (Array.isArray(values)) {
          latestIndex = values.length > 0 ? values.length - 1 : 0;
        }
        
        let latestValue = null;
        const latestSignal = signals[latestIndex] || 'hold';
        
        // Handle different indicator value structures
        if (indicatorType === 'MACD') {
          // MACD histogram array is shorter than macdLine due to signalPeriod offset
          // Use the last valid index for each array
          const macdValue = values.macdLine && Array.isArray(values.macdLine) && latestIndex < values.macdLine.length 
            ? values.macdLine[latestIndex] 
            : null;
          const signalValue = values.signalLine && Array.isArray(values.signalLine) && latestIndex < values.signalLine.length 
            ? values.signalLine[latestIndex] 
            : null;
          
          // Histogram array is shorter, use its last index
          const histogramValue = values.histogram && Array.isArray(values.histogram) && values.histogram.length > 0
            ? values.histogram[values.histogram.length - 1]
            : null;
          
          latestValue = {
            macd: macdValue,
            signal: signalValue,
            histogram: histogramValue
          };
        } else if (indicatorType === 'BOLLINGER') {
          latestValue = {
            upper: values.upper && Array.isArray(values.upper) ? values.upper[latestIndex] : null,
            middle: values.middle && Array.isArray(values.middle) ? values.middle[latestIndex] : null,
            lower: values.lower && Array.isArray(values.lower) ? values.lower[latestIndex] : null,
            currentPrice: latestPrice
          };
        } else {
          latestValue = Array.isArray(values) ? values[latestIndex] : null;
        }

        // Get signal strength
        const signalStrength = indicator.getSignalStrength ? indicator.getSignalStrength(latestIndex) : 0.5;
        
        // Generate explanation (wrap in try-catch to handle any formatting errors)
        let explanation;
        try {
          explanation = generateIndicatorExplanation(
            indicatorType,
            latestValue,
            latestSignal,
            params,
            latestPrice
          );
        } catch (explanationError) {
          console.warn(`Failed to generate explanation for ${indicatorType}:`, explanationError.message);
          explanation = {
            signalExplanation: `Unable to generate explanation for ${indicatorType}`,
            description: `${indicatorType} indicator calculation completed`,
            currentValue: latestValue,
            currentPrice: latestPrice
          };
        }

        results[indicatorType] = {
          type: indicatorType,
          value: latestValue,
          signal: latestSignal,
          strength: signalStrength,
          params,
          explanation,
          metadata: {
            ...metadata,
            window: indicator.window
          },
          allValues: values, // Include all values for charting
          allSignals: signals // Include all signals for charting
        };
      } catch (error) {
        console.warn(`Failed to calculate ${indicatorType} for ${tickerUpper}:`, error.message);
        results[indicatorType] = {
          type: indicatorType,
          error: error.message,
          value: null,
          signal: 'hold',
          strength: 0
        };
      }
    }

    return {
      ticker: tickerUpper,
      currentPrice: latestPrice,
      indicators: results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error getting indicators for ${ticker}:`, error.message);
    throw error;
  }
}

/**
 * Get stock recommendation based on ticker and horizon
 * POST /stocks/recommend
 * Body: { ticker: string, horizon: number, riskTolerance?: string }
 */
async function getStockRecommendation(body) {
  try {
    const { ticker, horizon, riskTolerance = 'medium' } = body;
    
    if (!ticker || !horizon) {
      throw new Error('Ticker and horizon are required');
    }

    const { isDBConnected } = require('../db/connection');
    const { IndicatorService } = require('../services/IndicatorService');
    const StrategyService = require('../services/StrategyService');
    const PriceDataService = require('../services/PriceDataService');
    
    if (!isDBConnected()) {
      throw new Error('Database not connected');
    }

    const tickerUpper = ticker.toUpperCase();
    const horizonNum = parseInt(horizon);
    
    if (isNaN(horizonNum) || horizonNum < 1) {
      throw new Error('Horizon must be a positive number (years)');
    }

    // Get price data (last year for indicators)
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const priceDataService = new PriceDataService();
    const priceData = await priceDataService.getPriceData(tickerUpper, startDateStr, endDate, 'daily');
    
    if (!priceData || priceData.length === 0) {
      throw new Error(`No price data found for ${tickerUpper}`);
    }

    const latestPrice = priceData[priceData.length - 1].close;
    
    // Recommend strategy based on horizon
    const strategyService = new StrategyService();
    const recommendation = strategyService.recommendStrategy({
      horizon: horizonNum,
      riskTolerance,
      portfolioSize: 1 // Single stock
    });

    const strategy = recommendation.strategyObject;
    
    // Calculate indicators using the recommended strategy
    const indicatorResults = {};
    const indicatorSignals = {};
    
    for (const indicatorConfig of strategy.indicators) {
      try {
        const indicator = IndicatorService.createIndicator(
          indicatorConfig.type,
          indicatorConfig.params
        );
        
        const values = indicator.compute(priceData);
        const signals = indicator.getAllSignals();
        
        const latestIndex = Array.isArray(values) 
          ? (values.length > 0 ? values.length - 1 : 0)
          : (values.macd && Array.isArray(values.macd) 
            ? (values.macd.length > 0 ? values.macd.length - 1 : 0)
            : (values.upper && Array.isArray(values.upper)
              ? (values.upper.length > 0 ? values.upper.length - 1 : 0)
              : 0));
        
        const latestSignal = signals[latestIndex] || 'hold';
        
        indicatorResults[indicatorConfig.type] = {
          type: indicatorConfig.type,
          value: Array.isArray(values) ? values[latestIndex] : values,
          signal: latestSignal,
          params: indicatorConfig.params,
          allSignals: signals
        };
        
        indicatorSignals[indicatorConfig.type] = signals;
      } catch (error) {
        console.warn(`Failed to calculate ${indicatorConfig.type} for ${tickerUpper}:`, error.message);
        indicatorResults[indicatorConfig.type] = {
          type: indicatorConfig.type,
          error: error.message,
          signal: 'hold'
        };
        indicatorSignals[indicatorConfig.type] = ['hold'];
      }
    }

    // Generate final signal using strategy rules
    const finalSignal = strategy.applyRules(indicatorSignals, priceData);
    const confidence = strategy.calculateConfidence(indicatorSignals, priceData);
    const reason = strategy.generateReason(finalSignal, indicatorSignals);

    // Generate comprehensive recommendation
    const recommendationText = generateRecommendationText(
      finalSignal,
      confidence,
      reason,
      recommendation.strategy,
      horizonNum,
      latestPrice
    );

    return {
      ticker: tickerUpper,
      currentPrice: latestPrice,
      horizon: horizonNum,
      riskTolerance,
      recommendedStrategy: recommendation.strategy,
      strategyName: strategy.name,
      strategyDescription: strategy.getStrategyDescription(),
      strategyFrequency: recommendation.frequency,
      strategyConfidence: recommendation.confidence,
      strategyReasoning: recommendation.reasoning,
      finalRecommendation: finalSignal,
      confidence: confidence,
      recommendationText,
      reason,
      indicators: indicatorResults,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting stock recommendation:', error.message);
    throw error;
  }
}

/**
 * Generate comprehensive recommendation text
 */
function generateRecommendationText(signal, confidence, reason, strategyName, horizon, currentPrice) {
  const confidenceLevel = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'moderate' : 'low';
  const confidenceText = confidenceLevel === 'high' 
    ? 'strong confidence' 
    : confidenceLevel === 'moderate' 
    ? 'moderate confidence' 
    : 'low confidence';
  
  const strategyNames = {
    'conservative': 'Conservative Strategy',
    'momentum': 'Momentum Strategy',
    'trend_following': 'Trend Following Strategy',
    'mean_reversion': 'Mean Reversion Strategy'
  };

  const strategyDisplayName = strategyNames[strategyName] || strategyName;

  let recommendation = '';
  
  if (signal === 'buy') {
    recommendation = `Based on the ${strategyDisplayName} analysis for a ${horizon}-year horizon, we recommend **BUYING** with ${confidenceText} (${(confidence * 100).toFixed(0)}% confidence). `;
    recommendation += `The technical indicators suggest ${reason}. `;
    recommendation += `This recommendation is optimized for a ${horizon}-year investment horizon.`;
  } else if (signal === 'sell') {
    recommendation = `Based on the ${strategyDisplayName} analysis for a ${horizon}-year horizon, we recommend **SELLING** with ${confidenceText} (${(confidence * 100).toFixed(0)}% confidence). `;
    recommendation += `The technical indicators suggest ${reason}. `;
    recommendation += `This recommendation is optimized for a ${horizon}-year investment horizon.`;
  } else {
    recommendation = `Based on the ${strategyDisplayName} analysis for a ${horizon}-year horizon, we recommend **HOLDING** with ${confidenceText} (${(confidence * 100).toFixed(0)}% confidence). `;
    recommendation += `The technical indicators are ${reason || 'showing mixed signals'}. `;
    recommendation += `This recommendation is optimized for a ${horizon}-year investment horizon.`;
  }

  return recommendation;
}

/**
 * Generate human-readable explanation for an indicator
 */
function generateIndicatorExplanation(type, value, signal, params, currentPrice) {
  const explanations = {
    SMA: {
      buy: `Price crossed above the ${params.window}-day Simple Moving Average. The SMA is the average of closing prices over the last ${params.window} days. When price breaks above this average, it suggests upward momentum.`,
      sell: `Price crossed below the ${params.window}-day Simple Moving Average. This indicates potential downward momentum as price falls below the average of recent closes.`,
      hold: `Price is trading near the ${params.window}-day Simple Moving Average. The SMA (${typeof value === 'number' ? value.toFixed(2) : 'N/A'}) acts as a support/resistance level. No clear trend signal.`,
      description: `Simple Moving Average (SMA) calculates the average closing price over ${params.window} periods. It smooths out price fluctuations to show the overall trend.`
    },
    EMA: {
      buy: `Price crossed above the ${params.window}-day Exponential Moving Average. EMA gives more weight to recent prices than SMA, making it more responsive to current trends.`,
      sell: `Price crossed below the ${params.window}-day Exponential Moving Average. The EMA reacts faster to price changes, indicating a potential trend reversal.`,
      hold: `Price is trading near the ${params.window}-day EMA (${typeof value === 'number' ? value.toFixed(2) : 'N/A'}). The EMA emphasizes recent price action more than the SMA.`,
      description: `Exponential Moving Average (EMA) is similar to SMA but gives exponentially decreasing weight to older prices, making it more sensitive to recent price movements.`
    },
    RSI: {
      buy: `RSI is ${typeof value === 'number' ? value.toFixed(2) : 'N/A'} (below ${params.oversold}). RSI measures momentum on a 0-100 scale. Values below ${params.oversold} suggest the stock is oversold and may bounce back.`,
      sell: `RSI is ${typeof value === 'number' ? value.toFixed(2) : 'N/A'} (above ${params.overbought}). Values above ${params.overbought} indicate the stock is overbought and may pull back.`,
      hold: `RSI is ${typeof value === 'number' ? value.toFixed(2) : 'N/A'} (between ${params.oversold} and ${params.overbought}). This indicates neutral momentum. RSI compares average gains to average losses over ${params.window} periods.`,
      description: `Relative Strength Index (RSI) measures the speed and magnitude of price changes. It's calculated by comparing average gains to average losses over ${params.window} periods, normalized to a 0-100 scale.`
    },
    MACD: {
      buy: `MACD line (${value && typeof value.macd === 'number' ? value.macd.toFixed(2) : 'N/A'}) crossed above the signal line (${value && typeof value.signal === 'number' ? value.signal.toFixed(2) : 'N/A'}). This bullish crossover indicates increasing upward momentum. The histogram shows the difference between MACD and signal lines.`,
      sell: `MACD line (${value && typeof value.macd === 'number' ? value.macd.toFixed(2) : 'N/A'}) crossed below the signal line (${value && typeof value.signal === 'number' ? value.signal.toFixed(2) : 'N/A'}). This bearish crossover suggests weakening momentum.`,
      hold: `MACD is neutral. MACD (${value && typeof value.macd === 'number' ? value.macd.toFixed(2) : 'N/A'}) is calculated from the difference between ${params.fastPeriod}-day and ${params.slowPeriod}-day EMAs. The signal line is a ${params.signalPeriod}-day EMA of the MACD line.`,
      description: `Moving Average Convergence Divergence (MACD) shows the relationship between two EMAs (${params.fastPeriod}-day and ${params.slowPeriod}-day). The MACD line crossing the signal line (${params.signalPeriod}-day EMA of MACD) generates buy/sell signals.`
    },
    BOLLINGER: {
      buy: `Price ($${typeof currentPrice === 'number' ? currentPrice.toFixed(2) : 'N/A'}) touched or crossed the lower Bollinger Band ($${typeof value?.lower === 'number' ? value.lower.toFixed(2) : 'N/A'}). This suggests the stock is oversold and may rebound toward the middle band ($${typeof value?.middle === 'number' ? value.middle.toFixed(2) : 'N/A'}).`,
      sell: `Price ($${typeof currentPrice === 'number' ? currentPrice.toFixed(2) : 'N/A'}) touched or crossed the upper Bollinger Band ($${typeof value?.upper === 'number' ? value.upper.toFixed(2) : 'N/A'}). This indicates the stock is overbought and may pull back.`,
      hold: `Price is trading within the Bollinger Bands. The middle band ($${typeof value?.middle === 'number' ? value.middle.toFixed(2) : 'N/A'}) is the ${params.window}-day SMA. Upper and lower bands are ${params.multiplier} standard deviations away, indicating volatility.`,
      description: `Bollinger Bands consist of a ${params.window}-day SMA (middle band) and upper/lower bands ${params.multiplier} standard deviations away. They show price volatility and potential support/resistance levels.`
    }
  };

  const exp = explanations[type];
  if (!exp) return `No explanation available for ${type}`;
  
  return {
    signalExplanation: exp[signal] || exp.hold,
    description: exp.description,
    currentValue: value,
    currentPrice: currentPrice
  };
}

/**
 * Helper: Get market status
 */
function getMarketStatus() {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  
  // Market is open Mon-Fri, 9:30 AM - 4:00 PM EST (14:30 - 21:00 UTC)
  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = hour >= 14 && (hour < 21 || (hour === 21 && now.getUTCMinutes() === 0));
  
  if (isWeekday && isMarketHours) {
    return 'open';
  } else if (isWeekday) {
    return 'closed';
  } else {
    return 'weekend';
  }
}

/**
 * Get list of commonly available stocks (popular US stocks)
 * GET /stocks/popular
 * Returns: Array of popular stock symbols with metadata
 */
async function getPopularStocks() {
  try {
    // List of commonly traded US stocks across major exchanges
    const popularSymbols = [
      // Technology
      'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'NFLX', 'TSLA', 'AMD',
      // Finance
      'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BRK.B',
      // Healthcare
      'JNJ', 'PFE', 'UNH', 'ABBV', 'TMO',
      // Consumer
      'WMT', 'HD', 'MCD', 'SBUX', 'NKE', 'DIS',
      // Energy
      'XOM', 'CVX', 'COP',
      // Industrial
      'BA', 'CAT', 'GE', 'HON',
      // Communication
      'VZ', 'T', 'CMCSA',
      // Utilities
      'NEE', 'DUK',
      // Retail
      'COST', 'TGT',
      // Other
      'V', 'MA', 'PG', 'KO', 'PEP'
    ];

    console.log(`Checking ${popularSymbols.length} popular stocks...`);
    
    const results = [];
    
    // Check in batches to respect rate limits (5 per minute)
    for (let i = 0; i < popularSymbols.length; i += 5) {
      const batch = popularSymbols.slice(i, i + 5);
      
      for (const symbol of batch) {
        try {
          const security = new Security(symbol);
          const isValid = await security.validate_symbol();
          
          if (isValid) {
            results.push(security.get_metadata());
          }
        } catch (error) {
          console.warn(`Could not validate ${symbol}:`, error.message);
        }
      }
      
      // Rate limit: wait 1 minute between batches (5 calls/min limit)
      if (i + 5 < popularSymbols.length) {
        await new Promise(resolve => setTimeout(resolve, 61000)); // 61 seconds
      }
    }

    return {
      count: results.length,
      stocks: results,
      note: 'This is a sample of popular US stocks. Alpha Vantage supports US exchanges (NYSE, NASDAQ). Use POST /stocks/search to validate specific symbols.'
    };
  } catch (error) {
    console.error('Error getting popular stocks:', error.message);
    throw error;
  }
}

module.exports = {
  initializePortfolio,
  getPortfolioSignals,
  getPortfolioStrategy,
  runBacktest,
  getPaperTradingStatus,
  generateCoupledTrade,
  getPortfolioPerformance,
  createUser,
  loginUser,
  verifyAuth,
  getUser,
  getUserPortfolios,
  searchStocks,
  getPopularStocks,
  getAvailableStocks,
  getWatchlist,
  getStockDetails,
  getStockIndicators,
  getStockRecommendation
};
