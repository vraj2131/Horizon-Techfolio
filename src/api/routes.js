/**
 * Route handlers for HorizonTrader API
 * Pure Node.js implementation without Express
 */

const Security = require('../models/Security');
const Portfolio = require('../models/Portfolio');
const Strategy = require('../models/Strategy');
const StrategyService = require('../services/StrategyService');
const DBService = require('../db/dbService');
const PriceDataService = require('../services/PriceDataService');
const dailyUpdateService = require('../services/DailyUpdateService');
// Note: BacktestSession, CoupledTrade, and PaperTradingService will be implemented in later phases

const strategyService = new StrategyService();
const priceDataService = new PriceDataService();

/**
 * Initialize a new portfolio with tickers and horizon
 * POST /portfolio/initialize
 * Body: { tickers: [], horizon: 1|2|5, userId: string } - userId is REQUIRED and must exist in database
 */
async function initializePortfolio(body) {
  try {
    const { tickers, horizon, userId } = body;
    
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
    const securities = [];
    const validationResults = [];

    for (const ticker of tickers) {
      try {
        const security = new Security(ticker);
        const isValid = await security.validate_symbol();
        
        if (isValid) {
          securities.push(security);
          validationResults.push({ ticker, status: 'valid' });
        } else {
          validationResults.push({ ticker, status: 'invalid', error: 'Symbol not found' });
        }
      } catch (error) {
        validationResults.push({ ticker, status: 'error', error: error.message });
      }
    }

    // Check if we have enough valid securities
    const validSecurities = securities.filter(s => s);
    if (validSecurities.length === 0) {
      throw new Error('No valid tickers found');
    }

    // Initialize price data for all valid tickers (background, non-blocking)
    const tickerSymbols = validSecurities.map(s => s.ticker);
    dailyUpdateService.initializeTickers(tickerSymbols).catch(err => {
      console.warn('Background data initialization error (non-critical):', err.message);
    });

    // Create portfolio with validated userId
    const portfolio = new Portfolio(validSecurities, parseInt(horizon));
    const portfolioId = `portfolio_${Date.now()}`;
    await DBService.savePortfolio(portfolioId, portfolio, userId);

    console.log(`Portfolio ${portfolioId} created with ${validSecurities.length} valid securities`);

    return {
      portfolioId,
      userId: userId,
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
    
    return {
      portfolioId,
      strategy: recommendation.strategy,
      signals: Array.from(signals.values()),
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
        name: explanation.name,
        description: explanation.description,
        frequency: explanation.frequency,
        indicators: explanation.indicators.map(ind => ind.type),
        confidence: recommendation.confidence
      },
      recommendation: recommendation.reasoning,
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
 * Body: { userId: string, name: string, email?: string }
 */
async function createUser(body) {
  try {
    const { userId, name, email } = body;
    
    if (!userId || !name) {
      throw new Error('userId and name are required');
    }

    await DBService.saveUser(userId, name, email || null);
    
    return {
      userId,
      name,
      email: email || null,
      message: 'User created successfully'
    };
  } catch (error) {
    console.error('User creation error:', error.message);
    throw error;
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
  getUser,
  getUserPortfolios,
  searchStocks,
  getPopularStocks
};
