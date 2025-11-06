/**
 * TradingService.js
 * Service for handling buy/sell trading operations with wallet management
 */

const WalletModel = require('../db/models/WalletModel');
const TransactionModel = require('../db/models/TransactionModel');
const PortfolioModel = require('../db/models/PortfolioModel');
const PriceDataService = require('./PriceDataService');
const MarketDataProvider = require('./MarketDataProvider');
const config = require('../../config/config');

class TradingService {
  constructor() {
    this.marketDataProvider = new MarketDataProvider(config.alphaVantage);
    this.priceDataService = new PriceDataService();
  }

  /**
   * Get or create wallet for a user
   */
  async getOrCreateWallet(userId, initialBalance = 10000) {
    try {
      return await WalletModel.getOrCreateWallet(userId, initialBalance);
    } catch (error) {
      console.error('Error getting/creating wallet:', error);
      throw new Error(`Failed to get wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet details with portfolio value
   */
  async getWalletDetails(userId) {
    try {
      const wallet = await WalletModel.findByUserId(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Get user's portfolios to calculate total holdings value
      const portfolios = await PortfolioModel.find({ userId });
      let totalHoldingsValue = 0;

      for (const portfolio of portfolios) {
        if (portfolio.positions && portfolio.positions.length > 0) {
          for (const position of portfolio.positions) {
            // Get current price
            const currentPrice = await this.getCurrentPrice(position.ticker);
            if (currentPrice) {
              totalHoldingsValue += position.quantity * currentPrice;
            }
          }
        }
      }

      return {
        wallet: wallet.toObject(),
        totalHoldingsValue,
        totalPortfolioValue: wallet.balance + totalHoldingsValue,
        cashPercentage: totalHoldingsValue > 0 
          ? ((wallet.balance / (wallet.balance + totalHoldingsValue)) * 100).toFixed(2)
          : 100
      };
    } catch (error) {
      console.error('Error getting wallet details:', error);
      throw error;
    }
  }

  /**
   * Buy stocks
   */
  async buyStock(userId, portfolioId, ticker, quantity, options = {}) {
    try {
      // Validate inputs
      if (!userId || !ticker || !quantity || quantity <= 0) {
        throw new Error('Invalid buy order parameters');
      }

      // Get wallet
      const wallet = await this.getOrCreateWallet(userId);
      if (wallet.status !== 'active') {
        throw new Error('Wallet is not active');
      }

      // Get current price
      const currentPrice = await this.getCurrentPrice(ticker);
      if (!currentPrice) {
        throw new Error(`Unable to get current price for ${ticker}`);
      }

      // Calculate costs
      const commission = options.commission || config.trading?.commission || 0;
      const subtotal = quantity * currentPrice;
      const total = subtotal + commission;

      // Check if user has sufficient funds
      if (!wallet.hasAvailableFunds(total)) {
        throw new Error(
          `Insufficient funds. Required: $${total.toFixed(2)}, Available: $${wallet.availableBalance.toFixed(2)}`
        );
      }

      // Deduct funds from wallet
      const balanceBefore = wallet.balance;
      wallet.deductFunds(total);
      wallet.totalInvested += subtotal;
      await wallet.save();

      // Create transaction record
      const transaction = await TransactionModel.createBuyTransaction({
        userId,
        portfolioId: portfolioId || null,
        ticker,
        quantity,
        price: currentPrice,
        commission,
        balanceBefore,
        orderSource: options.orderSource || 'manual',
        notes: options.notes || `Bought ${quantity} shares of ${ticker}`
      });

      // Update portfolio if portfolioId provided
      if (portfolioId) {
        await this.updatePortfolioPosition(portfolioId, ticker, quantity, currentPrice, 'buy');
      }

      return {
        success: true,
        transaction: transaction.toObject(),
        wallet: {
          balance: wallet.balance,
          availableBalance: wallet.availableBalance
        },
        message: `Successfully bought ${quantity} shares of ${ticker} at $${currentPrice.toFixed(2)}`
      };
    } catch (error) {
      console.error('Error buying stock:', error);
      throw error;
    }
  }

  /**
   * Sell stocks
   */
  async sellStock(userId, portfolioId, ticker, quantity, options = {}) {
    try {
      // Validate inputs
      if (!userId || !ticker || !quantity || quantity <= 0) {
        throw new Error('Invalid sell order parameters');
      }

      // Get wallet
      const wallet = await this.getOrCreateWallet(userId);
      if (wallet.status !== 'active') {
        throw new Error('Wallet is not active');
      }

      // Verify user has sufficient shares (if portfolioId provided)
      let costBasis = null;
      if (portfolioId) {
        const portfolio = await PortfolioModel.findById(portfolioId);
        if (!portfolio || portfolio.userId !== userId) {
          throw new Error('Portfolio not found or unauthorized');
        }

        const position = portfolio.positions.find(p => p.ticker === ticker);
        if (!position || position.quantity < quantity) {
          throw new Error(
            `Insufficient shares. You have ${position?.quantity || 0} shares of ${ticker}`
          );
        }

        costBasis = position.averageCost;
      }

      // Get current price
      const currentPrice = await this.getCurrentPrice(ticker);
      if (!currentPrice) {
        throw new Error(`Unable to get current price for ${ticker}`);
      }

      // Calculate proceeds
      const commission = options.commission || config.trading?.commission || 0;
      const subtotal = quantity * currentPrice;
      const total = subtotal - commission;

      // Add funds to wallet
      const balanceBefore = wallet.balance;
      wallet.addFunds(total);
      wallet.totalWithdrawn += subtotal;

      // Update profit/loss if cost basis known
      if (costBasis !== null) {
        const profitLoss = (currentPrice - costBasis) * quantity - commission;
        wallet.updateProfitLoss(profitLoss, profitLoss > 0);
      }

      await wallet.save();

      // Create transaction record
      const transaction = await TransactionModel.createSellTransaction({
        userId,
        portfolioId: portfolioId || null,
        ticker,
        quantity,
        price: currentPrice,
        commission,
        balanceBefore,
        costBasis,
        orderSource: options.orderSource || 'manual',
        notes: options.notes || `Sold ${quantity} shares of ${ticker}`
      });

      // Update portfolio if portfolioId provided
      if (portfolioId) {
        await this.updatePortfolioPosition(portfolioId, ticker, quantity, currentPrice, 'sell');
      }

      return {
        success: true,
        transaction: transaction.toObject(),
        wallet: {
          balance: wallet.balance,
          availableBalance: wallet.availableBalance
        },
        profitLoss: transaction.realizedProfitLoss,
        message: `Successfully sold ${quantity} shares of ${ticker} at $${currentPrice.toFixed(2)}`
      };
    } catch (error) {
      console.error('Error selling stock:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId, options = {}) {
    try {
      const transactions = await TransactionModel.getTransactionHistory(userId, options);
      const stats = await TransactionModel.getTransactionStats(userId);

      return {
        transactions: transactions.map(t => t.toObject()),
        stats,
        count: transactions.length
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Deposit funds to wallet (for testing/demo)
   */
  async depositFunds(userId, amount, notes = '') {
    try {
      if (amount <= 0) {
        throw new Error('Deposit amount must be positive');
      }

      const wallet = await this.getOrCreateWallet(userId);
      const balanceBefore = wallet.balance;

      wallet.addFunds(amount);
      wallet.totalDeposited += amount;
      await wallet.save();

      const transaction = await TransactionModel.createDepositTransaction(
        userId,
        amount,
        balanceBefore,
        notes || `Deposited $${amount.toFixed(2)}`
      );

      return {
        success: true,
        transaction: transaction.toObject(),
        wallet: {
          balance: wallet.balance,
          availableBalance: wallet.availableBalance
        },
        message: `Successfully deposited $${amount.toFixed(2)}`
      };
    } catch (error) {
      console.error('Error depositing funds:', error);
      throw error;
    }
  }

  /**
   * Get current stock price
   * Tries database first, then API as fallback
   */
  async getCurrentPrice(ticker) {
    try {
      // Try to get from database (most recent price)
      const priceData = await this.priceDataService.getLatestPrice(ticker);
      if (priceData && priceData.close) {
        return parseFloat(priceData.close);
      }

      // Fallback to API
      console.log(`Fetching current price for ${ticker} from API...`);
      const quote = await this.marketDataProvider.getQuote(ticker);
      if (quote && quote.price) {
        return parseFloat(quote.price);
      }

      throw new Error('Unable to retrieve current price');
    } catch (error) {
      console.error(`Error getting current price for ${ticker}:`, error);
      throw new Error(`Unable to get current price for ${ticker}`);
    }
  }

  /**
   * Update portfolio position after trade
   */
  async updatePortfolioPosition(portfolioId, ticker, quantity, price, action) {
    try {
      const portfolio = await PortfolioModel.findById(portfolioId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      const positionIndex = portfolio.positions.findIndex(p => p.ticker === ticker);

      if (action === 'buy') {
        if (positionIndex >= 0) {
          // Update existing position
          const position = portfolio.positions[positionIndex];
          const totalCost = (position.quantity * position.averageCost) + (quantity * price);
          const newQuantity = position.quantity + quantity;
          
          position.quantity = newQuantity;
          position.averageCost = totalCost / newQuantity;
          position.currentPrice = price;
          position.marketValue = newQuantity * price;
        } else {
          // Add new position
          portfolio.positions.push({
            ticker,
            quantity,
            averageCost: price,
            currentPrice: price,
            marketValue: quantity * price,
            profitLoss: 0,
            profitLossPercent: 0
          });
        }
      } else if (action === 'sell') {
        if (positionIndex >= 0) {
          const position = portfolio.positions[positionIndex];
          position.quantity -= quantity;
          
          if (position.quantity <= 0) {
            // Remove position if fully sold
            portfolio.positions.splice(positionIndex, 1);
          } else {
            // Update remaining position
            position.currentPrice = price;
            position.marketValue = position.quantity * price;
          }
        }
      }

      await portfolio.save();
      return portfolio;
    } catch (error) {
      console.error('Error updating portfolio position:', error);
      throw error;
    }
  }

  /**
   * Get holdings for a user across all portfolios
   */
  async getUserHoldings(userId) {
    try {
      // Calculate holdings from wallet transactions (buy/sell)
      const transactions = await TransactionModel.find({
        userId,
        type: { $in: ['buy', 'sell'] },
        status: 'completed',
        ticker: { $exists: true }
      }).sort({ createdAt: 1 });

      const holdings = new Map();

      // Calculate net holdings from transactions
      for (const tx of transactions) {
        if (!tx.ticker) continue;

        if (!holdings.has(tx.ticker)) {
          holdings.set(tx.ticker, {
            ticker: tx.ticker,
            quantity: 0,
            totalCostBasis: 0,
            averageCost: 0,
            currentPrice: 0,
            totalValue: 0,
            profitLoss: 0,
            profitLossPercent: 0
          });
        }

        const holding = holdings.get(tx.ticker);

        if (tx.type === 'buy') {
          // When buying: add shares and total cost (including fees/commissions)
          holding.quantity += tx.quantity;
          // Use total cost (subtotal + commission + fees) for accurate cost basis
          holding.totalCostBasis += (tx.total || tx.subtotal || 0);
        } else if (tx.type === 'sell') {
          // When selling: remove shares proportionally from cost basis
          // Calculate average cost before selling
          const avgCostPerShare = holding.quantity > 0 
            ? holding.totalCostBasis / holding.quantity 
            : 0;
          
          // Reduce quantity
          holding.quantity -= tx.quantity;
          
          // Reduce cost basis by the average cost of shares sold
          const costBasisOfSharesSold = avgCostPerShare * tx.quantity;
          holding.totalCostBasis -= costBasisOfSharesSold;
        }

        // Recalculate average cost after each transaction
        if (holding.quantity > 0) {
          holding.averageCost = holding.totalCostBasis / holding.quantity;
        } else {
          // If quantity is 0, reset cost basis
          holding.averageCost = 0;
          holding.totalCostBasis = 0;
        }
      }

      // Get current prices and calculate market values
      const holdingsArray = Array.from(holdings.values()).filter(h => h.quantity > 0);
      
      for (const holding of holdingsArray) {
        try {
          const currentPrice = await this.getCurrentPrice(holding.ticker);
          holding.currentPrice = currentPrice;
          holding.totalValue = holding.quantity * currentPrice;
          holding.profitLoss = holding.totalValue - holding.totalCostBasis;
          holding.profitLossPercent = holding.totalCostBasis > 0 
            ? (holding.profitLoss / holding.totalCostBasis) * 100 
            : 0;
        } catch (error) {
          console.error(`Failed to get price for ${holding.ticker}:`, error.message);
          // Keep zeros if price fetch fails
        }
      }

      return holdingsArray;
    } catch (error) {
      console.error('Error getting user holdings:', error);
      throw error;
    }
  }
}

module.exports = TradingService;

