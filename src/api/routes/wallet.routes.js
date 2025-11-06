/**
 * Wallet Routes
 * API routes for wallet management and trading operations
 */

const express = require('express');
const router = express.Router();
const TradingService = require('../../services/TradingService');
const { authenticate } = require('../middleware/auth.middleware');
const {
  validateBuyStock,
  validateSellStock,
  validateDeposit,
  validateTransactionHistory,
  validateUserId
} = require('../middleware/validation.middleware');

// Initialize trading service
const tradingService = new TradingService();

/**
 * Async handler to wrap route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /wallet/:userId
 * Get wallet details for a user
 */
router.get(
  '/:userId',
  validateUserId,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const walletDetails = await tradingService.getWalletDetails(userId);

    res.json({
      success: true,
      ...walletDetails
    });
  })
);

/**
 * POST /wallet/buy
 * Buy stocks
 * 
 * Body:
 * - userId: string (required)
 * - ticker: string (required)
 * - quantity: number (required)
 * - portfolioId: string (optional)
 */
router.post(
  '/buy',
  authenticate,
  validateBuyStock,
  asyncHandler(async (req, res) => {
    const { userId, ticker, quantity, portfolioId } = req.body;

    // Security: Ensure authenticated user matches the userId in request
    if (req.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only trade for your own account'
      });
    }

    const result = await tradingService.buyStock(
      userId,
      portfolioId,
      ticker.toUpperCase(),
      parseInt(quantity),
      {
        orderSource: 'manual',
        notes: `Manual buy order via API`
      }
    );

    res.status(201).json(result);
  })
);

/**
 * POST /wallet/sell
 * Sell stocks
 * 
 * Body:
 * - userId: string (required)
 * - ticker: string (required)
 * - quantity: number (required)
 * - portfolioId: string (optional)
 */
router.post(
  '/sell',
  authenticate,
  validateSellStock,
  asyncHandler(async (req, res) => {
    const { userId, ticker, quantity, portfolioId } = req.body;

    // Security: Ensure authenticated user matches the userId in request
    if (req.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only trade for your own account'
      });
    }

    const result = await tradingService.sellStock(
      userId,
      portfolioId,
      ticker.toUpperCase(),
      parseInt(quantity),
      {
        orderSource: 'manual',
        notes: `Manual sell order via API`
      }
    );

    res.status(201).json(result);
  })
);

/**
 * POST /wallet/deposit
 * Deposit funds to wallet (for demo/testing)
 * 
 * Body:
 * - userId: string (required)
 * - amount: number (required)
 * - notes: string (optional)
 */
router.post(
  '/deposit',
  authenticate,
  validateDeposit,
  asyncHandler(async (req, res) => {
    const { userId, amount, notes } = req.body;

    // Security: Ensure authenticated user matches the userId in request
    if (req.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only deposit to your own account'
      });
    }

    const result = await tradingService.depositFunds(
      userId,
      parseFloat(amount),
      notes
    );

    res.status(201).json(result);
  })
);

/**
 * GET /wallet/:userId/transactions
 * Get transaction history for a user
 * 
 * Query parameters:
 * - limit: number (optional, default: 50)
 * - skip: number (optional, default: 0)
 * - ticker: string (optional)
 * - type: string (optional) - buy, sell, deposit, withdrawal
 * - startDate: string (optional) - ISO 8601 format
 * - endDate: string (optional) - ISO 8601 format
 */
router.get(
  '/:userId/transactions',
  validateTransactionHistory,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit, skip, ticker, type, startDate, endDate } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 50,
      skip: skip ? parseInt(skip) : 0
    };

    if (ticker) options.ticker = ticker.toUpperCase();
    if (type) options.type = type;
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const result = await tradingService.getTransactionHistory(userId, options);

    res.json({
      success: true,
      userId,
      ...result
    });
  })
);

/**
 * GET /wallet/:userId/holdings
 * Get all holdings for a user across portfolios
 */
router.get(
  '/:userId/holdings',
  validateUserId,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const holdings = await tradingService.getUserHoldings(userId);

    res.json({
      success: true,
      userId,
      holdings,
      count: holdings.length
    });
  })
);

/**
 * GET /wallet/:userId/summary
 * Get complete wallet summary including balance, holdings, and stats
 */
router.get(
  '/:userId/summary',
  validateUserId,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Get wallet details
    const walletDetails = await tradingService.getWalletDetails(userId);
    
    // Get holdings
    const holdings = await tradingService.getUserHoldings(userId);
    
    // Get recent transactions
    const transactionHistory = await tradingService.getTransactionHistory(userId, {
      limit: 10
    });

    res.json({
      success: true,
      userId,
      wallet: walletDetails.wallet,
      summary: {
        totalCash: walletDetails.wallet.balance,
        totalHoldingsValue: walletDetails.totalHoldingsValue,
        totalPortfolioValue: walletDetails.totalPortfolioValue,
        cashPercentage: walletDetails.cashPercentage,
        totalProfitLoss: walletDetails.wallet.totalProfitLoss,
        totalTrades: walletDetails.wallet.totalTrades,
        winRate: walletDetails.wallet.totalTrades > 0
          ? ((walletDetails.wallet.winningTrades / walletDetails.wallet.totalTrades) * 100).toFixed(2)
          : 0
      },
      holdings: {
        positions: holdings,
        count: holdings.length
      },
      recentTransactions: transactionHistory.transactions,
      transactionStats: transactionHistory.stats
    });
  })
);

module.exports = router;

