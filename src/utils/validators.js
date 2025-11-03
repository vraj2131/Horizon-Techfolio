/**
 * Validation utilities for HorizonTrader
 */

/**
 * Validate ticker symbol format
 * @param {string} ticker - Ticker symbol to validate
 * @returns {boolean} True if valid format
 */
function validateTickerFormat(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    return false;
  }
  
  // Basic ticker format: 1-5 uppercase letters, optional numbers
  const tickerRegex = /^[A-Z]{1,5}[0-9]*$/;
  return tickerRegex.test(ticker.toUpperCase());
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if valid format
 */
function validateDateFormat(date) {
  if (!date || typeof date !== 'string') {
    return false;
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }
  
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate);
}

/**
 * Validate investment horizon
 * @param {number|string} horizon - Horizon value
 * @returns {boolean} True if valid horizon
 */
function validateHorizon(horizon) {
  const validHorizons = [1, 2, 5];
  const numHorizon = parseInt(horizon);
  return validHorizons.includes(numHorizon);
}

/**
 * Validate portfolio size
 * @param {Array} tickers - Array of tickers
 * @returns {boolean} True if valid size
 */
function validatePortfolioSize(tickers) {
  if (!Array.isArray(tickers)) {
    return false;
  }
  
  return tickers.length > 0 && tickers.length <= 20;
}

/**
 * Validate price value
 * @param {number} price - Price to validate
 * @returns {boolean} True if valid price
 */
function validatePrice(price) {
  return typeof price === 'number' && price > 0 && !isNaN(price);
}

/**
 * Validate shares quantity
 * @param {number} shares - Shares to validate
 * @returns {boolean} True if valid shares
 */
function validateShares(shares) {
  return typeof shares === 'number' && shares > 0 && Number.isInteger(shares);
}

/**
 * Validate weight value (0.0 to 1.0)
 * @param {number} weight - Weight to validate
 * @returns {boolean} True if valid weight
 */
function validateWeight(weight) {
  return typeof weight === 'number' && weight >= 0 && weight <= 1;
}

/**
 * Validate API response structure
 * @param {Object} response - API response to validate
 * @param {Array<string>} requiredFields - Required field names
 * @returns {boolean} True if valid structure
 */
function validateApiResponse(response, requiredFields = []) {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  for (const field of requiredFields) {
    if (!(field in response)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Sanitize ticker symbol
 * @param {string} ticker - Raw ticker input
 * @returns {string} Sanitized ticker
 */
function sanitizeTicker(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    return '';
  }
  
  return ticker.trim().toUpperCase();
}

/**
 * Sanitize date string
 * @param {string} date - Raw date input
 * @returns {string} Sanitized date
 */
function sanitizeDate(date) {
  if (!date || typeof date !== 'string') {
    return '';
  }
  
  return date.trim();
}

/**
 * Validate backtest parameters
 * @param {Object} params - Backtest parameters
 * @returns {Object} Validation result
 */
function validateBacktestParams(params) {
  const errors = [];
  
  if (!params.portfolioId) {
    errors.push('Portfolio ID is required');
  }
  
  if (params.startDate && !validateDateFormat(params.startDate)) {
    errors.push('Invalid start date format (use YYYY-MM-DD)');
  }
  
  if (params.endDate && !validateDateFormat(params.endDate)) {
    errors.push('Invalid end date format (use YYYY-MM-DD)');
  }
  
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    if (start >= end) {
      errors.push('Start date must be before end date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateTickerFormat,
  validateDateFormat,
  validateHorizon,
  validatePortfolioSize,
  validatePrice,
  validateShares,
  validateWeight,
  validateApiResponse,
  sanitizeTicker,
  sanitizeDate,
  validateBacktestParams
};






