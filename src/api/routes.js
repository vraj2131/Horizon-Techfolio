/**
 * Route handlers for HorizonTrader API
 * Pure Node.js implementation without Express
 */

const Security = require('../models/Security');
const Portfolio = require('../models/Portfolio');
const Strategy = require('../models/Strategy');
const StrategyService = require('../services/StrategyService');
// Note: BacktestSession, CoupledTrade, and PaperTradingService will be implemented in later phases

// In-memory storage for demo purposes
const portfolios = new Map();
const backtestSessions = new Map();
const paperTradingSessions = new Map();
const strategyService = new StrategyService();

/**
 * Initialize a new portfolio with tickers and horizon
 * POST /portfolio/initialize
 */
async function initializePortfolio(body) {
  try {
    const { tickers, horizon } = body;
    
    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      throw new Error('Tickers array is required');
    }
    
    if (!horizon || !['1', '2', '5'].includes(horizon.toString())) {
      throw new Error('Horizon must be 1, 2, or 5 years');
    }

    if (tickers.length > 20) {
      throw new Error('Maximum 20 tickers allowed');
    }

    console.log(`Initializing portfolio with ${tickers.length} tickers for ${horizon}-year horizon`);

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

    // Create portfolio
    const portfolio = new Portfolio(validSecurities, parseInt(horizon));
    const portfolioId = `portfolio_${Date.now()}`;
    portfolios.set(portfolioId, portfolio);

    console.log(`Portfolio ${portfolioId} created with ${validSecurities.length} valid securities`);

    return {
      portfolioId,
      horizon: parseInt(horizon),
      securities: validSecurities.map(s => s.get_metadata()),
      validationResults,
      message: `Portfolio initialized with ${validSecurities.length} valid securities`
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
    const portfolio = portfolios.get(portfolioId);
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
    
    // Fetch current price data for all securities
    const priceDataMap = new Map();
    for (const ticker of portfolio.getTickers()) {
      const position = portfolio.getPosition(ticker);
      if (position) {
        try {
          const priceData = await position.security.fetch_history('2024-10-01', '2024-10-28');
          priceDataMap.set(ticker, priceData);
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
    const portfolio = portfolios.get(portfolioId);
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

    const portfolio = portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    console.log(`Running backtest for portfolio ${portfolioId}`);
    
    // This will be implemented in Phase 5 (Backtesting)
    // For now, return a placeholder
    const sessionId = `backtest_${Date.now()}`;
    backtestSessions.set(sessionId, {
      portfolioId,
      startDate: startDate || '2020-01-01',
      endDate: endDate || '2023-12-31',
      status: 'completed'
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
    const portfolio = portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    console.log(`Getting paper trading status for portfolio ${portfolioId}`);
    
    // This will be implemented in Phase 6 (Paper Trading)
    // For now, return a placeholder
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

    const portfolio = portfolios.get(portfolioId);
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
    const portfolio = portfolios.get(portfolioId);
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

module.exports = {
  initializePortfolio,
  getPortfolioSignals,
  getPortfolioStrategy,
  runBacktest,
  getPaperTradingStatus,
  generateCoupledTrade,
  getPortfolioPerformance
};
