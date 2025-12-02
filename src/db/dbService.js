/**
 * Database Service - Abstraction layer for portfolio, backtest, and paper trading data
 * Supports both MongoDB (when available) and in-memory fallback
 */

const { isDBConnected } = require('./connection');
const PortfolioModel = require('./models/PortfolioModel');
const BacktestSessionModel = require('./models/BacktestSessionModel');
const PaperTradingSessionModel = require('./models/PaperTradingSessionModel');
const UserModel = require('./models/UserModel');
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
   * Get all portfolios for a user
   */
  static async getUserPortfolios(userId) {
    if (this.useDatabase()) {
      try {
        const portfolioDocs = await PortfolioModel.find({ userId }).sort({ createdAt: -1 });
        return portfolioDocs.map(doc => {
          // Get cash value - prefer saved value, fallback to initialCapital, then default
          let cash = doc.cash;
          if (cash === null || cash === undefined || cash === 0) {
            // If cash is 0/null, check if we have initialCapital (for portfolios that haven't traded yet)
            if (doc.initialCapital !== null && doc.initialCapital !== undefined && doc.initialCapital > 0) {
              cash = doc.initialCapital; // Use initialCapital as cash for new portfolios
            } else {
              // For portfolios created before initialCapital field existed, use default
              cash = 100000; // Default fallback
            }
          }
          
          // Calculate positions value - try multiple fields for compatibility
          const positionsValue = (doc.positions || []).reduce((sum, pos) => {
            // Try marketValue first, then calculate from quantity/currentPrice, then shares/currentPrice
            if (pos.marketValue && pos.marketValue > 0) {
              return sum + pos.marketValue;
            }
            const quantity = pos.quantity || pos.shares || 0;
            const currentPrice = pos.currentPrice || 0;
            if (quantity > 0 && currentPrice > 0) {
              return sum + (quantity * currentPrice);
            }
            return sum;
          }, 0);
          
          // Current value = cash + positions value
          const currentValue = cash + positionsValue;
          
          // Initial capital: use saved initialCapital if available
          // For portfolios created before this field existed, use cash as initialCapital
          // This ensures: if portfolio has $100k cash and no trades, P&L = $0
          let initialCapital = doc.initialCapital;
          if (initialCapital === null || initialCapital === undefined) {
            // If initialCapital not set, use cash (which should be the starting amount)
            initialCapital = cash;
          }
          
          return {
            portfolioId: doc.portfolioId,
            userId: doc.userId,
            name: doc.name || null,
            horizon: doc.horizon,
            securities: doc.securities || [],
            positions: doc.positions || [],
            cash: cash,
            initialCapital: initialCapital,
            currentValue: currentValue,
            status: 'active',
            createdAt: doc.createdAt
          };
        });
      } catch (error) {
        console.error('Error loading user portfolios from database:', error.message);
        // Fallback: return empty array if DB fails
        return [];
      }
    } else {
      // Memory fallback: would need to track userId in memory storage
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

