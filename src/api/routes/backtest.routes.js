/**
 * Backtest Routes
 * Express router for backtesting endpoints
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/error.middleware');

// Import route handlers from the old routes.js
const { runBacktest } = require('../routes');

/**
 * POST /backtest/run
 * Run a historical backtest on a single stock
 * Body: { ticker: string, startDate: string, endDate: string, initialCapital: number, strategy: string }
 */
router.post(
  '/run',
  asyncHandler(async (req, res) => {
    const result = await runBacktest(req.body);
    res.json(result);
  })
);

/**
 * POST /backtest
 * Legacy endpoint - redirects to /run
 * Body: { ticker: string, startDate: string, endDate: string, initialCapital: number, strategy: string }
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const result = await runBacktest(req.body);
    res.json(result);
  })
);

module.exports = router;

