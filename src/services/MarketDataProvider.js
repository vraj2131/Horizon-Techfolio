/**
 * MarketDataProvider - Unified interface to Alpha Vantage API
 * Handles historical data, real-time quotes, rate limiting, and caching
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../config/config');

class MarketDataProvider {
  constructor() {
    this.apiKey = config.alphaVantage.apiKey;
    this.baseUrl = config.alphaVantage.baseUrl;
    this.rateLimit = config.alphaVantage.rateLimit;
    this.callCount = 0;
    this.lastCallTime = 0;
    this.cache = new Map();
    this.cacheDir = config.cache.cacheDir;
    
    // Ensure cache directory exists
    this.ensureCacheDir();
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.warn('Warning: Could not create cache directory:', error.message);
    }
  }

  /**
   * Rate limiting to respect Alpha Vantage free tier limits
   */
  async checkRateLimit() {
    const now = Date.now();
    
    // Reset call count if more than a minute has passed
    if (now - this.lastCallTime > 60000) {
      this.callCount = 0;
    }
    
    // Check if we've exceeded the rate limit
    if (this.callCount >= this.rateLimit.callsPerMinute) {
      const waitTime = 60000 - (now - this.lastCallTime);
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.callCount = 0;
    }
    
    this.callCount++;
    this.lastCallTime = now;
  }

  /**
   * Get cache key for a request
   */
  getCacheKey(ticker, startDate, endDate, interval = 'daily') {
    return `${ticker}_${startDate}_${endDate}_${interval}`;
  }

  /**
   * Load data from cache
   */
  async loadFromCache(cacheKey) {
    try {
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
      const data = await fs.readFile(cacheFile, 'utf8');
      const cached = JSON.parse(data);
      
      // Check if cache is still valid
      const now = Date.now();
      if (now - cached.timestamp < config.cache.historicalDataTTL) {
        console.log(`Cache hit for ${cacheKey}`);
        return cached.data;
      }
    } catch (error) {
      // Cache miss or invalid data
    }
    return null;
  }

  /**
   * Save data to cache
   */
  async saveToCache(cacheKey, data) {
    try {
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
      const cacheData = {
        timestamp: Date.now(),
        data: data
      };
      await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
      console.log(`Cached data for ${cacheKey}`);
    } catch (error) {
      console.warn('Warning: Could not save to cache:', error.message);
    }
  }

  /**
   * Make API call to Alpha Vantage with error handling
   */
  async makeApiCall(params) {
    await this.checkRateLimit();
    
    const url = new URL(this.baseUrl);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    url.searchParams.append('apikey', this.apiKey);

    try {
      console.log(`Making API call: ${url.toString()}`);
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for API error messages
      if (data['Error Message']) {
        throw new Error(`API Error: ${data['Error Message']}`);
      }
      
      if (data['Note']) {
        throw new Error(`API Note: ${data['Note']}`);
      }
      
      return data;
    } catch (error) {
      console.error('API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Get historical price data for a security
   * @param {string} ticker - Stock symbol
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} interval - Data interval (daily, weekly, monthly)
   * @returns {Promise<Array>} Array of price data points
   */
  async get_prices(ticker, startDate, endDate, interval = 'daily') {
    const cacheKey = this.getCacheKey(ticker, startDate, endDate, interval);
    
    // Try cache first
    const cachedData = await this.loadFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const params = {
        function: 'TIME_SERIES_DAILY',
        symbol: ticker,
        outputsize: 'full' // Get full historical data
      };

      const data = await this.makeApiCall(params);
      
      if (!data['Time Series (Daily)']) {
        throw new Error(`No time series data found for ${ticker}`);
      }

      const timeSeries = data['Time Series (Daily)'];
      const priceData = [];

      // Convert Alpha Vantage format to our standard format
      Object.keys(timeSeries).forEach(date => {
        const dayData = timeSeries[date];
        const pricePoint = {
          date: date,
          open: parseFloat(dayData['1. open']),
          high: parseFloat(dayData['2. high']),
          low: parseFloat(dayData['3. low']),
          close: parseFloat(dayData['4. close']),
          volume: parseInt(dayData['5. volume'])
        };
        
        // Filter by date range
        if (date >= startDate && date <= endDate) {
          priceData.push(pricePoint);
        }
      });

      // Sort by date (oldest first)
      priceData.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Cache the result
      await this.saveToCache(cacheKey, priceData);

      return priceData;
    } catch (error) {
      console.error(`Failed to get historical data for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Get real-time quote for a security
   * @param {string} ticker - Stock symbol
   * @returns {Promise<Object>} Current quote data
   */
  async get_quote(ticker) {
    try {
      const params = {
        function: 'GLOBAL_QUOTE',
        symbol: ticker
      };

      const data = await this.makeApiCall(params);
      
      if (!data['Global Quote'] || !data['Global Quote']['01. symbol']) {
        throw new Error(`No quote data found for ${ticker}`);
      }

      const quote = data['Global Quote'];
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Failed to get quote for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate if a ticker symbol exists
   * @param {string} ticker - Stock symbol to validate
   * @returns {Promise<boolean>} True if valid, false otherwise
   */
  async validate_symbol(ticker) {
    try {
      // Try to get a recent quote to validate the symbol
      await this.get_quote(ticker);
      return true;
    } catch (error) {
      console.log(`Symbol validation failed for ${ticker}:`, error.message);
      return false;
    }
  }

  /**
   * Get multiple quotes in batch (with rate limiting)
   * @param {Array<string>} tickers - Array of stock symbols
   * @returns {Promise<Array>} Array of quote objects
   */
  async get_multiple_quotes(tickers) {
    const quotes = [];
    
    for (const ticker of tickers) {
      try {
        const quote = await this.get_quote(ticker);
        quotes.push(quote);
      } catch (error) {
        console.warn(`Failed to get quote for ${ticker}:`, error.message);
        quotes.push({
          symbol: ticker,
          error: error.message
        });
      }
    }
    
    return quotes;
  }

  /**
   * Clear cache
   */
  async clearCache() {
    try {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(this.cacheDir, file));
        }
      }
      console.log('Cache cleared');
    } catch (error) {
      console.warn('Warning: Could not clear cache:', error.message);
    }
  }
}

module.exports = MarketDataProvider;

