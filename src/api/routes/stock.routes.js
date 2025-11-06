/**
 * Stock Routes
 * Express router for stock-related endpoints
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/error.middleware');
const { validateStockSearch } = require('../middleware/validation.middleware');

// Import route handlers from the old routes.js
const {
  searchStocks,
  getPopularStocks,
  getAvailableStocks,
  getWatchlist,
  getStockDetails,
  getStockIndicators,
  getStockRecommendation
} = require('../routes');

/**
 * POST /stocks/search
 * Validate stock symbols
 * Body: { tickers: string[] }
 */
router.post(
  '/search',
  validateStockSearch,
  asyncHandler(async (req, res) => {
    const result = await searchStocks(req.body);
    res.json(result);
  })
);

/**
 * GET /stocks/popular
 * Get list of popular stocks
 */
router.get(
  '/popular',
  asyncHandler(async (req, res) => {
    const result = await getPopularStocks();
    res.json(result);
  })
);

/**
 * GET /stocks/available
 * Get list of stocks available in the database
 */
router.get(
  '/available',
  asyncHandler(async (req, res) => {
    const result = await getAvailableStocks();
    res.json(result);
  })
);

/**
 * GET /stocks/watchlist
 * Get watchlist with current prices and daily changes
 */
router.get(
  '/watchlist',
  asyncHandler(async (req, res) => {
    const result = await getWatchlist();
    res.json(result);
  })
);

/**
 * POST /stocks/recommend
 * Get stock recommendation based on ticker and horizon
 * Body: { ticker: string, horizon: number, riskTolerance?: string }
 */
router.post(
  '/recommend',
  asyncHandler(async (req, res) => {
    const result = await getStockRecommendation(req.body);
    res.json(result);
  })
);

/**
 * GET /stocks/:ticker/indicators
 * Get technical indicators for a stock
 * NOTE: This must come before /:ticker route to avoid route conflicts
 */
router.get(
  '/:ticker/indicators',
  asyncHandler(async (req, res) => {
    const { ticker } = req.params;
    const result = await getStockIndicators(ticker);
    res.json(result);
  })
);

/**
 * GET /stocks/:ticker
 * Get detailed stock information
 */
router.get(
  '/:ticker',
  asyncHandler(async (req, res) => {
    const { ticker } = req.params;
    const result = await getStockDetails(ticker);
    res.json(result);
  })
);

module.exports = router;

