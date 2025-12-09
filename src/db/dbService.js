/**
 * Database Service - Abstraction layer for portfolio, backtest, and paper trading data
 * Supports both MongoDB (when available) and in-memory fallback
 */

const { isDBConnected } = require('./connection');
const PortfolioModel = require('./models/PortfolioModel');
const BacktestSessionModel = require('./models/BacktestSessionModel');
const PaperTradingSessionModel = require('./models/PaperTradingSessionModel');
const UserModel = require('./models/UserModel');
const PriceDataModel = require('./models/PriceDataModel');
const Portfolio = require('../models/Portfolio');
const Security = require('../models/Security');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// In-memory fallback storage
const memoryPortfolios = new Map();
const memoryBacktestSessions = new Map();
const memoryPaperTradingSessions = new Map();
const memoryUsers = new Map();

class DBService {
  /**
   * Check if database is available
   */
  static useDatabase() {
    return isDBConnected();
  }

  // ==================== Portfolio Operations ====================

  // ==================== User Operations ====================

  /**
   * Save user to database or memory
   * @param {string} userId - User ID
   * @param {string} name - User name
   * @param {string|null} email - User email (optional)
   * @param {string|null} password - Plain text password (will be hashed)
   */
  static async saveUser(userId, name, email = null, password = null) {
    let passwordHash = null;
    
    // Hash password if provided
    if (password) {
      try {
        passwordHash = await bcrypt.hash(password, 10);
      } catch (error) {
        console.error('Error hashing password:', error.message);
        throw new Error('Failed to hash password');
      }
    }
    
    if (this.useDatabase()) {
      try {
        await UserModel.findOneAndUpdate(
          { userId },
          { userId, name, email, passwordHash, createdAt: new Date() },
          { upsert: true, new: true }
        );
        return true;
      } catch (error) {
        console.error('Error saving user to database:', error.message);
        memoryUsers.set(userId, new User(userId, name, email, passwordHash));
        return false;
      }
    } else {
      memoryUsers.set(userId, new User(userId, name, email, passwordHash));
      return true;
    }
  }
  
  /**
   * Verify user password
   * @param {string} userId - User ID
   * @param {string} password - Plain text password to verify
   * @returns {Promise<boolean>} True if password matches
   */
  static async verifyPassword(userId, password) {
    const user = await this.getUserWithPassword(userId);
    if (!user || !user.passwordHash) {
      return false;
    }
    
    try {
      return await bcrypt.compare(password, user.passwordHash);
    } catch (error) {
      console.error('Error verifying password:', error.message);
      return false;
    }
  }
  
  /**
   * Get user with password hash (for authentication)
   * @param {string} userId - User ID
   * @returns {Promise<User|null>} User object with password hash
   */
  static async getUserWithPassword(userId) {
    if (this.useDatabase()) {
      try {
        const userDoc = await UserModel.findOne({ userId });
        if (!userDoc) {
          return null;
        }
        return new User(userDoc.userId, userDoc.name, userDoc.email, userDoc.passwordHash);
      } catch (error) {
        console.error('Error loading user from database:', error.message);
        const user = memoryUsers.get(userId);
        return user || null;
      }
    } else {
      return memoryUsers.get(userId) || null;
    }
  }

  /**
   * Get user from database or memory (without password hash)
   */
  static async getUser(userId) {
    if (this.useDatabase()) {
      try {
        const userDoc = await UserModel.findOne({ userId });
        if (!userDoc) {
          return null;
        }
        // Return user without password hash for security
        return new User(userDoc.userId, userDoc.name, userDoc.email, null);
      } catch (error) {
        console.error('Error loading user from database:', error.message);
        const user = memoryUsers.get(userId);
        if (user) {
          // Return user without password hash
          return new User(user.userId, user.name, user.email, null);
        }
        return null;
      }
    } else {
      const user = memoryUsers.get(userId);
      if (user) {
        // Return user without password hash
        return new User(user.userId, user.name, user.email, null);
      }
      return null;
    }
  }

  /**
   * Get all portfolios for a user (with current prices fetched from price data)
   */
  static async getUserPortfolios(userId) {
    if (this.useDatabase()) {
      try {
        const portfolioDocs = await PortfolioModel.find({ userId }).sort({ createdAt: -1 });
        
        // Fetch current prices for all unique tickers across all portfolios
        const allTickers = new Set();
        portfolioDocs.forEach(doc => {
          (doc.positions || []).forEach(pos => {
            if (pos.ticker) allTickers.add(pos.ticker);
          });
          (doc.securities || []).forEach(sec => {
            if (sec.ticker) allTickers.add(sec.ticker);
          });
        });
        
        // Get current prices from price data
        const currentPrices = new Map();
        for (const ticker of allTickers) {
          try {
            // Try both uppercase and original case
            const tickerUpper = ticker.toUpperCase();
            let priceDoc = await PriceDataModel.findOne({ ticker: tickerUpper, interval: 'daily' });
            if (!priceDoc) {
              priceDoc = await PriceDataModel.findOne({ ticker: ticker, interval: 'daily' });
            }
            if (priceDoc && priceDoc.data && priceDoc.data.length > 0) {
              const latestPrice = priceDoc.data[priceDoc.data.length - 1];
              if (latestPrice && latestPrice.close) {
                const price = parseFloat(latestPrice.close);
                if (!isNaN(price) && price > 0) {
                  // Store with both uppercase and original case for lookup
                  currentPrices.set(tickerUpper, price);
                  currentPrices.set(ticker, price);
                }
              }
            }
          } catch (priceError) {
            console.warn(`Could not fetch price for ${ticker}:`, priceError.message);
          }
        }
        
        return portfolioDocs.map(doc => {
          // Get cash value - prefer saved value, fallback to initialCapital, then default
          let cash = doc.cash;
          if (cash === null || cash === undefined || cash === 0) {
            if (doc.initialCapital !== null && doc.initialCapital !== undefined && doc.initialCapital > 0) {
              cash = doc.initialCapital;
            } else {
              cash = 100000;
            }
          }
          
          // Enhance positions with current prices and calculate values
          const enhancedPositions = (doc.positions || []).map(pos => {
            const ticker = pos.ticker;
            const tickerUpper = ticker ? ticker.toUpperCase() : '';
            const quantity = pos.quantity || pos.shares || 0;
            const avgCost = pos.avg_cost || pos.avgCost || 0;
            // Try to get price with both uppercase and original case
            let currentPrice = currentPrices.get(ticker) || currentPrices.get(tickerUpper);
            
            // If price not found, log warning but don't use avgCost (which makes P&L always 0)
            if (currentPrice === undefined && quantity > 0) {
              console.warn(`⚠️  No current price found for ${ticker} (tried ${ticker} and ${tickerUpper}), using last known price or 0`);
              // Don't use avgCost as fallback - that makes P&L always show $0.00
              // Instead, try to get from position data or use 0
              currentPrice = pos.currentPrice || 0;
            } else if (currentPrice === undefined) {
              currentPrice = 0;
            }
            
            const marketValue = quantity * currentPrice;
            const costBasis = quantity * avgCost;
            const pnl = marketValue - costBasis;
            const pnlPercent = costBasis > 0 ? ((pnl / costBasis) * 100) : 0;
            
            // Debug log for positions with unexpected P&L
            if (quantity > 0 && avgCost > 0 && currentPrice > 0 && Math.abs(pnl) < 0.01) {
              console.log(`🔍 ${ticker}: qty=${quantity}, avgCost=${avgCost.toFixed(2)}, currentPrice=${currentPrice.toFixed(2)}, pnl=${pnl.toFixed(2)}`);
            }
            
            return {
              ticker,
              quantity,
              shares: quantity,
              avgCost,
              avg_cost: avgCost,
              currentPrice,
              marketValue,
              costBasis,
              pnl,
              pnlPercent,
              // Aliases for frontend fields
              profitLoss: pnl,
              profitLossPercent: pnlPercent,
              side: pos.side || 'long'
            };
          });
          
          // Calculate total positions value using current prices
          const positionsValue = enhancedPositions.reduce((sum, pos) => sum + (pos.marketValue || 0), 0);
          const totalCostBasis = enhancedPositions.reduce((sum, pos) => sum + (pos.costBasis || 0), 0);
          
          // Current value = cash + positions value
          const currentValue = cash + positionsValue;
          
          // Initial capital
          let initialCapital = doc.initialCapital;
          if (initialCapital === null || initialCapital === undefined) {
            initialCapital = cash + totalCostBasis; // Cash + what was invested
          }
          
          // Total P&L
          const totalPnL = currentValue - initialCapital;
          const totalPnLPercent = initialCapital > 0 ? ((totalPnL / initialCapital) * 100) : 0;
          
          return {
            portfolioId: doc.portfolioId,
            userId: doc.userId,
            name: doc.name || null,
            horizon: doc.horizon,
            securities: doc.securities || [],
            positions: enhancedPositions,
            cash: cash,
            initialCapital: initialCapital,
            currentValue: currentValue,
            totalPnL: parseFloat(totalPnL.toFixed(2)),
            totalPnLPercent: parseFloat(totalPnLPercent.toFixed(2)),
            status: 'active',
            createdAt: doc.createdAt
          };
        });
      } catch (error) {
        console.error('Error loading user portfolios from database:', error.message);
        return [];
      }
    } else {
      return [];
    }
  }

  // ==================== Portfolio Operations ====================

  /**
   * Save portfolio to database or memory
   */
  static async savePortfolio(portfolioId, portfolio, userId) {
    if (this.useDatabase()) {
      try {
        // Convert Portfolio object to database format
        const securities = portfolio.getTickers().map(ticker => {
          const position = portfolio.getPosition(ticker);
          return position ? position.security.get_metadata() : null;
        }).filter(s => s !== null);

        const positions = portfolio.getTickers().map(ticker => {
          const position = portfolio.getPosition(ticker);
          if (!position) return null;
          return {
            ticker: position.security.ticker,
            side: position.side,
            shares: position.shares,
            avg_cost: position.avg_cost,
            pnl_unrealized: position.pnl_unrealized
          };
        }).filter(p => p !== null);

        if (!userId) {
          throw new Error('userId is required when saving portfolio');
        }

        const portfolioData = {
          portfolioId,
          userId: userId, // Required - must be validated before calling this method
          name: portfolio.name || null, // Save portfolio name if provided
          horizon: portfolio.horizon,
          cash: portfolio.cash,
          initialCapital: portfolio.initialCapital || portfolio.cash || null, // Track initial capital (defaults to initial cash)
          risk_budget: portfolio.risk_budget,
          securities,
          positions,
          createdAt: portfolio.createdAt || new Date(),
          lastUpdated: portfolio.lastUpdated || new Date()
        };

        await PortfolioModel.findOneAndUpdate(
          { portfolioId },
          portfolioData,
          { upsert: true, new: true }
        );

        return true;
      } catch (error) {
        console.error('Error saving portfolio to database:', error.message);
        // Fall back to memory
        memoryPortfolios.set(portfolioId, portfolio);
        return false;
      }
    } else {
      memoryPortfolios.set(portfolioId, portfolio);
      return true;
    }
  }

  /**
   * Get portfolio from database or memory (with optional userId check)
   */
  static async getPortfolio(portfolioId, userId = null) {
    if (this.useDatabase()) {
      try {
        const query = { portfolioId };
        if (userId) {
          query.userId = userId; // Ensure user owns this portfolio
        }
        const portfolioDoc = await PortfolioModel.findOne(query);
        if (!portfolioDoc) {
          return null;
        }

        // Convert database document to Portfolio object
        const securities = portfolioDoc.securities.map(s => {
          return new Security(s.ticker, s.name, s.exchange, s.sector, s.inception_date);
        });

        const portfolio = new Portfolio(securities, portfolioDoc.horizon, portfolioDoc.cash);
        portfolio.risk_budget = portfolioDoc.risk_budget;
        portfolio.createdAt = portfolioDoc.createdAt;
        portfolio.lastUpdated = portfolioDoc.lastUpdated;

        // Restore positions
        for (const posData of portfolioDoc.positions) {
          const security = securities.find(s => s.ticker === posData.ticker);
          if (security) {
            const position = portfolio.getPosition(posData.ticker);
            if (position) {
              position.shares = posData.shares;
              position.avg_cost = posData.avg_cost;
              position.pnl_unrealized = posData.pnl_unrealized;
              position.side = posData.side;
            }
          }
        }

        return portfolio;
      } catch (error) {
        console.error('Error loading portfolio from database:', error.message);
        // Fall back to memory
        return memoryPortfolios.get(portfolioId) || null;
      }
    } else {
      return memoryPortfolios.get(portfolioId) || null;
    }
  }

  /**
   * Delete portfolio
   */
  static async deletePortfolio(portfolioId) {
    if (this.useDatabase()) {
      try {
        await PortfolioModel.deleteOne({ portfolioId });
      } catch (error) {
        console.error('Error deleting portfolio from database:', error.message);
      }
    }
    memoryPortfolios.delete(portfolioId);
  }

  // ==================== Backtest Session Operations ====================

  /**
   * Save backtest session
   */
  static async saveBacktestSession(sessionId, sessionData) {
    if (this.useDatabase()) {
      try {
        await BacktestSessionModel.findOneAndUpdate(
          { sessionId },
          { ...sessionData, sessionId },
          { upsert: true, new: true }
        );
        return true;
      } catch (error) {
        console.error('Error saving backtest session to database:', error.message);
        memoryBacktestSessions.set(sessionId, sessionData);
        return false;
      }
    } else {
      memoryBacktestSessions.set(sessionId, sessionData);
      return true;
    }
  }

  /**
   * Get backtest session
   */
  static async getBacktestSession(sessionId) {
    if (this.useDatabase()) {
      try {
        const session = await BacktestSessionModel.findOne({ sessionId });
        return session ? session.toObject() : null;
      } catch (error) {
        console.error('Error loading backtest session from database:', error.message);
        return memoryBacktestSessions.get(sessionId) || null;
      }
    } else {
      return memoryBacktestSessions.get(sessionId) || null;
    }
  }

  /**
   * Get all backtest sessions for a portfolio
   */
  static async getBacktestSessionsByPortfolio(portfolioId) {
    if (this.useDatabase()) {
      try {
        const sessions = await BacktestSessionModel.find({ portfolioId }).sort({ createdAt: -1 });
        return sessions.map(s => s.toObject());
      } catch (error) {
        console.error('Error loading backtest sessions from database:', error.message);
        // Return from memory if available
        return Array.from(memoryBacktestSessions.values())
          .filter(s => s.portfolioId === portfolioId);
      }
    } else {
      return Array.from(memoryBacktestSessions.values())
        .filter(s => s.portfolioId === portfolioId);
    }
  }

  // ==================== Paper Trading Session Operations ====================

  /**
   * Save paper trading session
   */
  static async savePaperTradingSession(portfolioId, sessionData) {
    if (this.useDatabase()) {
      try {
        await PaperTradingSessionModel.findOneAndUpdate(
          { portfolioId },
          { ...sessionData, portfolioId },
          { upsert: true, new: true }
        );
        return true;
      } catch (error) {
        console.error('Error saving paper trading session to database:', error.message);
        memoryPaperTradingSessions.set(portfolioId, sessionData);
        return false;
      }
    } else {
      memoryPaperTradingSessions.set(portfolioId, sessionData);
      return true;
    }
  }

  /**
   * Get paper trading session
   */
  static async getPaperTradingSession(portfolioId) {
    if (this.useDatabase()) {
      try {
        const session = await PaperTradingSessionModel.findOne({ portfolioId });
        return session ? session.toObject() : null;
      } catch (error) {
        console.error('Error loading paper trading session from database:', error.message);
        return memoryPaperTradingSessions.get(portfolioId) || null;
      }
    } else {
      return memoryPaperTradingSessions.get(portfolioId) || null;
    }
  }
}

module.exports = DBService;

