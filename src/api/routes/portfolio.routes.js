/**
 * Portfolio Routes
 * Express router for portfolio-related endpoints
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const {
  validatePortfolioCreation,
  validatePortfolioId,
  validateCustomPortfolio,
  validateCuratedPortfolio,
  validateCuratedOptionsQuery
} = require('../middleware/validation.middleware');

// Import route handlers from the old routes.js
// These will be migrated in the next step
const {
  initializePortfolio,
  createCustomPortfolio,
  createCuratedPortfolio,
  getCuratedPortfolioOptions,
  getPortfolioSignals,
  getPortfolioStrategy,
  getPortfolioPerformance
} = require('../routes');

/**
 * POST /portfolio/initialize
 * Create a new portfolio (legacy endpoint)
 * Body: { tickers: string[], horizon: 1|2|5, userId: string }
 */
router.post(
  '/initialize',
  validatePortfolioCreation,
  asyncHandler(async (req, res) => {
    const result = await initializePortfolio(req.body);
    res.status(201).json(result);
  })
);

/**
 * POST /portfolio/custom
 * Create a custom portfolio with user-selected tickers
 * Body: { tickers: string[], horizon: 1|2|5, userId: string, portfolioName?: string, initialCapital?: number }
 */
router.post(
  '/custom',
  validateCustomPortfolio,
  asyncHandler(async (req, res) => {
    const result = await createCustomPortfolio(req.body);
    res.status(201).json(result);
  })
);

/**
 * POST /portfolio/curated
 * Create a curated portfolio with equal-weight allocation
 * Body: { horizon: 1|2|5, portfolioType: 'growth'|'balanced'|'defensive', userId: string, initialCapital: number }
 */
router.post(
  '/curated',
  validateCuratedPortfolio,
  asyncHandler(async (req, res) => {
    const result = await createCuratedPortfolio(req.body);
    res.status(201).json(result);
  })
);

/**
 * GET /portfolio/curated/options
 * Get available curated portfolio options
 * Query: { horizon?: 1|2|5 }
 */
router.get(
  '/curated/options',
  validateCuratedOptionsQuery,
  asyncHandler(async (req, res) => {
    const result = await getCuratedPortfolioOptions(req.query.horizon);
    res.json(result);
  })
);

/**
 * GET /portfolio/:id/signals
 * Get buy/hold/sell signals for a portfolio
 */
router.get(
  '/:id/signals',
  validatePortfolioId,
  asyncHandler(async (req, res) => {
    const result = await getPortfolioSignals(req.params.id);
    res.json(result);
  })
);

/**
 * GET /portfolio/:id/strategy
 * Get recommended strategy for a portfolio
 */
router.get(
  '/:id/strategy',
  validatePortfolioId,
  asyncHandler(async (req, res) => {
    const result = await getPortfolioStrategy(req.params.id);
    res.json(result);
  })
);

/**
 * GET /portfolio/:id/performance
 * Get performance metrics for a portfolio
 */
router.get(
  '/:id/performance',
  validatePortfolioId,
  asyncHandler(async (req, res) => {
    const result = await getPortfolioPerformance(req.params.id);
    res.json(result);
  })
);

module.exports = router;

