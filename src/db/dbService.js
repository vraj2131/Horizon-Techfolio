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
   */
  static async saveUser(userId, name, email = null) {
    if (this.useDatabase()) {
      try {
        await UserModel.findOneAndUpdate(
          { userId },
          { userId, name, email, createdAt: new Date() },
          { upsert: true, new: true }
        );
        return true;
      } catch (error) {
        console.error('Error saving user to database:', error.message);
        memoryUsers.set(userId, new User(userId, name, email));
        return false;
      }
    } else {
      memoryUsers.set(userId, new User(userId, name, email));
      return true;
    }
  }

  /**
   * Get user from database or memory
   */
  static async getUser(userId) {
    if (this.useDatabase()) {
      try {
        const userDoc = await UserModel.findOne({ userId });
        if (!userDoc) {
          return null;
        }
        return new User(userDoc.userId, userDoc.name, userDoc.email);
      } catch (error) {
        console.error('Error loading user from database:', error.message);
        return memoryUsers.get(userId) || null;
      }
    } else {
      return memoryUsers.get(userId) || null;
    }
  }

  /**
   * Get all portfolios for a user
   */
  static async getUserPortfolios(userId) {
    if (this.useDatabase()) {
      try {
        const portfolioDocs = await PortfolioModel.find({ userId }).sort({ createdAt: -1 });
        return portfolioDocs.map(doc => ({
          portfolioId: doc.portfolioId,
          userId: doc.userId,
          horizon: doc.horizon,
          createdAt: doc.createdAt
        }));
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
          horizon: portfolio.horizon,
          cash: portfolio.cash,
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

