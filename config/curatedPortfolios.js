/**
 * Curated Portfolio Options by Investment Horizon
 * Each horizon has multiple portfolio types: Growth, Balanced, Defensive
 * Portfolios use equal-weight allocation across 4-5 stocks
 * 
 * IMPORTANT: Only uses stocks available in the database:
 * AAPL, AMZN, BAC, CVX, DIS, GOOGL, HD, JNJ, JPM, MA, META, MSFT, NFLX, NVDA, PG, TSLA, UNH, V, WMT, XOM
 */

const curatedPortfolios = {
  // 1-Year Horizon - Short-term, more volatile, momentum-focused
  '1': {
    growth: {
      id: '1y-growth',
      name: 'Short-Term Growth',
      description: 'High-growth tech stocks for aggressive short-term gains. Higher volatility, potential for rapid appreciation.',
      horizon: 1,
      type: 'growth',
      tickers: ['NVDA', 'TSLA', 'META', 'AMZN', 'NFLX'],
      rebalanceFrequency: 'weekly',
      riskLevel: 'high',
      expectedVolatility: 'high'
    },
    balanced: {
      id: '1y-balanced',
      name: 'Short-Term Balanced',
      description: 'Mix of growth and stable stocks for moderate short-term returns with reduced risk.',
      horizon: 1,
      type: 'balanced',
      tickers: ['AAPL', 'MSFT', 'GOOGL', 'JPM', 'V'],
      rebalanceFrequency: 'weekly',
      riskLevel: 'medium',
      expectedVolatility: 'medium'
    },
    defensive: {
      id: '1y-defensive',
      name: 'Short-Term Defensive',
      description: 'Stable, dividend-paying stocks for capital preservation with modest gains.',
      horizon: 1,
      type: 'defensive',
      tickers: ['JNJ', 'PG', 'WMT', 'XOM', 'UNH'],
      rebalanceFrequency: 'weekly',
      riskLevel: 'low',
      expectedVolatility: 'low'
    }
  },

  // 2-Year Horizon - Medium-term, balanced approach
  '2': {
    growth: {
      id: '2y-growth',
      name: 'Medium-Term Growth',
      description: 'Growth-oriented portfolio with tech leaders for 2-year appreciation potential.',
      horizon: 2,
      type: 'growth',
      tickers: ['MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'],
      rebalanceFrequency: 'monthly',
      riskLevel: 'high',
      expectedVolatility: 'medium-high'
    },
    balanced: {
      id: '2y-balanced',
      name: 'Medium-Term Balanced',
      description: 'Diversified mix of sectors for steady medium-term growth with moderate risk.',
      horizon: 2,
      type: 'balanced',
      tickers: ['AAPL', 'JPM', 'UNH', 'HD', 'V'],
      rebalanceFrequency: 'monthly',
      riskLevel: 'medium',
      expectedVolatility: 'medium'
    },
    defensive: {
      id: '2y-defensive',
      name: 'Medium-Term Defensive',
      description: 'Blue-chip dividend stocks for stable returns over 2 years.',
      horizon: 2,
      type: 'defensive',
      tickers: ['WMT', 'PG', 'JNJ', 'CVX', 'XOM'],
      rebalanceFrequency: 'monthly',
      riskLevel: 'low',
      expectedVolatility: 'low'
    }
  },

  // 5-Year Horizon - Long-term, compound growth focus
  '5': {
    growth: {
      id: '5y-growth',
      name: 'Long-Term Growth',
      description: 'High-conviction growth stocks for maximum long-term wealth building.',
      horizon: 5,
      type: 'growth',
      tickers: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'NVDA'],
      rebalanceFrequency: 'quarterly',
      riskLevel: 'medium-high',
      expectedVolatility: 'medium'
    },
    balanced: {
      id: '5y-balanced',
      name: 'Long-Term Balanced',
      description: 'Diversified portfolio of market leaders for steady long-term compound growth.',
      horizon: 5,
      type: 'balanced',
      tickers: ['AAPL', 'JPM', 'UNH', 'MA', 'HD'],
      rebalanceFrequency: 'quarterly',
      riskLevel: 'medium',
      expectedVolatility: 'medium'
    },
    defensive: {
      id: '5y-defensive',
      name: 'Long-Term Defensive',
      description: 'Conservative dividend stocks for reliable long-term income and capital preservation.',
      horizon: 5,
      type: 'defensive',
      tickers: ['JNJ', 'PG', 'WMT', 'XOM', 'CVX'],
      rebalanceFrequency: 'quarterly',
      riskLevel: 'low',
      expectedVolatility: 'low'
    }
  }
};

/**
 * Get all curated portfolios for a specific horizon
 * @param {number|string} horizon - Investment horizon (1, 2, or 5)
 * @returns {Object} Object containing growth, balanced, defensive options
 */
function getPortfoliosByHorizon(horizon) {
  const h = horizon.toString();
  return curatedPortfolios[h] || null;
}

/**
 * Get a specific curated portfolio by horizon and type
 * @param {number|string} horizon - Investment horizon (1, 2, or 5)
 * @param {string} type - Portfolio type ('growth', 'balanced', 'defensive')
 * @returns {Object|null} Portfolio configuration or null if not found
 */
function getCuratedPortfolio(horizon, type) {
  const h = horizon.toString();
  const t = type.toLowerCase();
  
  if (!curatedPortfolios[h]) {
    return null;
  }
  
  return curatedPortfolios[h][t] || null;
}

/**
 * Get all available horizons
 * @returns {Array<string>} Array of available horizons
 */
function getAvailableHorizons() {
  return Object.keys(curatedPortfolios);
}

/**
 * Get all portfolio types
 * @returns {Array<string>} Array of portfolio types
 */
function getPortfolioTypes() {
  return ['growth', 'balanced', 'defensive'];
}

/**
 * Get all curated portfolios as flat array
 * @returns {Array<Object>} Array of all portfolio configurations
 */
function getAllCuratedPortfolios() {
  const all = [];
  for (const horizon of Object.keys(curatedPortfolios)) {
    for (const type of Object.keys(curatedPortfolios[horizon])) {
      all.push(curatedPortfolios[horizon][type]);
    }
  }
  return all;
}

/**
 * Available stocks in the database (for reference)
 */
const availableStocks = [
  'AAPL', 'AMZN', 'BAC', 'CVX', 'DIS', 'GOOGL', 'HD', 'JNJ', 'JPM', 'MA',
  'META', 'MSFT', 'NFLX', 'NVDA', 'PG', 'TSLA', 'UNH', 'V', 'WMT', 'XOM'
];

module.exports = {
  curatedPortfolios,
  getPortfoliosByHorizon,
  getCuratedPortfolio,
  getAvailableHorizons,
  getPortfolioTypes,
  getAllCuratedPortfolios,
  availableStocks
};
