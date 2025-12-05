/**
 * Test helper functions for HorizonTrader
 */

const Security = require('../../src/models/Security');
const Portfolio = require('../../src/models/Portfolio');
const Position = require('../../src/models/Position');

/**
 * Create a mock security for testing
 * @param {string} ticker - Ticker symbol
 * @param {Object} metadata - Additional metadata
 * @returns {Security} Mock security
 */
function createMockSecurity(ticker, metadata = {}) {
  return new Security(
    ticker,
    metadata.name || `${ticker} Inc.`,
    metadata.exchange || 'NASDAQ',
    metadata.sector || 'Technology',
    metadata.inception_date || '2000-01-01'
  );
}

/**
 * Create a mock portfolio for testing
 * @param {Array<string>} tickers - Array of ticker symbols
 * @param {number} horizon - Investment horizon
 * @param {number} initialCash - Initial cash amount
 * @returns {Portfolio} Mock portfolio
 */
function createMockPortfolio(tickers, horizon = 2, initialCash = 100000) {
  const securities = tickers.map(ticker => createMockSecurity(ticker));
  return new Portfolio(securities, horizon, initialCash);
}

/**
 * Create mock price data for testing
 * @param {string} ticker - Ticker symbol
 * @param {number} days - Number of days of data
 * @param {number} startPrice - Starting price
 * @param {number} volatility - Price volatility (0-1)
 * @returns {Array} Array of price data points
 */
function createMockPriceData(ticker, days = 100, startPrice = 100, volatility = 0.02) {
  const priceData = [];
  let currentPrice = startPrice;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    // Random walk with slight upward bias
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    currentPrice = Math.max(currentPrice + change, 0.01);
    
    priceData.push({
      date: date.toISOString().split('T')[0],
      open: currentPrice * (1 + (Math.random() - 0.5) * 0.01),
      high: currentPrice * (1 + Math.random() * 0.02),
      low: currentPrice * (1 - Math.random() * 0.02),
      close: currentPrice,
      volume: Math.floor(Math.random() * 1000000) + 100000
    });
  }
  
  return priceData;
}

/**
 * Create mock quote data for testing
 * @param {string} ticker - Ticker symbol
 * @param {number} price - Current price
 * @returns {Object} Mock quote object
 */
function createMockQuote(ticker, price = 100) {
  return {
    symbol: ticker,
    price: price,
    change: (Math.random() - 0.5) * price * 0.05,
    changePercent: (Math.random() - 0.5) * 5,
    volume: Math.floor(Math.random() * 1000000) + 100000,
    timestamp: new Date().toISOString()
  };
}

/**
 * Wait for a specified number of milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert that two numbers are approximately equal
 * @param {number} actual - Actual value
 * @param {number} expected - Expected value
 * @param {number} tolerance - Tolerance for comparison
 */
function expectApproximatelyEqual(actual, expected, tolerance = 0.001) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ${actual} to be approximately equal to ${expected} (tolerance: ${tolerance})`);
  }
}

/**
 * Assert that an array contains valid price data
 * @param {Array} priceData - Price data to validate
 */
function expectValidPriceData(priceData) {
  if (!Array.isArray(priceData)) {
    throw new Error('Expected price data to be an array');
  }
  
  if (priceData.length === 0) {
    throw new Error('Expected price data to not be empty');
  }
  
  const requiredFields = ['date', 'open', 'high', 'low', 'close', 'volume'];
  const sample = priceData[0];
  
  for (const field of requiredFields) {
    if (!(field in sample)) {
      throw new Error(`Expected price data to have ${field} field`);
    }
  }
}

/**
 * Create a mock API response for testing
 * @param {string} ticker - Ticker symbol
 * @param {Array} priceData - Price data array
 * @returns {Object} Mock API response
 */
function createMockApiResponse(ticker, priceData) {
  const timeSeries = {};
  priceData.forEach(point => {
    timeSeries[point.date] = {
      '1. open': point.open.toString(),
      '2. high': point.high.toString(),
      '3. low': point.low.toString(),
      '4. close': point.close.toString(),
      '5. volume': point.volume.toString()
    };
  });
  
  return {
    'Meta Data': {
      '1. Information': 'Daily Prices (open, high, low, close) and Volumes',
      '2. Symbol': ticker,
      '3. Last Refreshed': priceData[priceData.length - 1].date,
      '4. Output Size': 'Full size',
      '5. Time Zone': 'US/Eastern'
    },
    'Time Series (Daily)': timeSeries
  };
}

module.exports = {
  createMockSecurity,
  createMockPortfolio,
  createMockPriceData,
  createMockQuote,
  delay,
  expectApproximatelyEqual,
  expectValidPriceData,
  createMockApiResponse
};


















