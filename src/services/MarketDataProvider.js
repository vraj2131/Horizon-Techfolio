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
    this.apiKeys = config.alphaVantage.apiKeys || [config.alphaVantage.apiKey];
    this.currentKeyIndex = 0;
    this.baseUrl = config.alphaVantage.baseUrl;
    this.rateLimit = config.alphaVantage.rateLimit;
    this.enableKeyRotation = config.alphaVantage.enableKeyRotation !== false;
    
    // Track call counts per key
    this.keyStats = {};
    this.apiKeys.forEach((key, index) => {
      this.keyStats[index] = {
        callCount: 0,
        lastCallTime: 0,
        rateLimitedUntil: 0 // Timestamp when rate limit expires
      };
    });
    
    this.cache = new Map();
    this.cacheDir = config.cache.cacheDir;
    
    // Ensure cache directory exists
    this.ensureCacheDir();
    
    console.log(`📊 MarketDataProvider initialized with ${this.apiKeys.length} API key(s)`);
    if (this.apiKeys.length > 1 && this.enableKeyRotation) {
      console.log('🔄 API key rotation enabled');
    }
  }
  
  /**
   * Get current active API key
   */
  getCurrentApiKey() {
    return this.apiKeys[this.currentKeyIndex];
  }
  
  /**
   * Check if current key is rate limited
   */
  isKeyRateLimited(keyIndex) {
    const stats = this.keyStats[keyIndex];
    return stats && Date.now() < stats.rateLimitedUntil;
  }
  
  /**
   * Mark a key as rate limited
   */
  markKeyRateLimited(keyIndex) {
    if (this.keyStats[keyIndex]) {
      // Rate limit typically lasts 1 minute, but we'll set it to 2 minutes for safety
      this.keyStats[keyIndex].rateLimitedUntil = Date.now() + (2 * 60 * 1000);
      console.log(`⚠️  API key ${keyIndex + 1} marked as rate limited. Will retry after ${new Date(this.keyStats[keyIndex].rateLimitedUntil).toLocaleTimeString()}`);
    }
  }
  
  /**
   * Switch to next available API key
   */
  switchToNextKey() {
    if (!this.enableKeyRotation || this.apiKeys.length <= 1) {
      return false;
    }
    
    const originalIndex = this.currentKeyIndex;
    let attempts = 0;
    
    // Try to find a non-rate-limited key
    while (attempts < this.apiKeys.length) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      attempts++;
      
      if (!this.isKeyRateLimited(this.currentKeyIndex)) {
        if (originalIndex !== this.currentKeyIndex) {
          console.log(`🔄 Switched to API key ${this.currentKeyIndex + 1} (attempted ${attempts} key(s))`);
        }
        return true;
      }
    }
    
    // All keys are rate limited, reset current index
    this.currentKeyIndex = originalIndex;
    console.log(`⚠️  All API keys are rate limited. Waiting for cooldown...`);
    return false;
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
   * Tracks per-key rate limits
   */
  async checkRateLimit() {
    const now = Date.now();
    const stats = this.keyStats[this.currentKeyIndex];
    
    if (!stats) return;
    
    // Reset call count if more than a minute has passed
    if (now - stats.lastCallTime > 60000) {
      stats.callCount = 0;
    }
    
    // Check if current key is rate limited
    if (this.isKeyRateLimited(this.currentKeyIndex)) {
      // Try to switch to another key
      if (this.switchToNextKey()) {
        // Switched to a new key, check its rate limit
        return this.checkRateLimit();
      } else {
        // All keys rate limited, wait for cooldown
        const waitTime = Math.max(0, stats.rateLimitedUntil - now);
        if (waitTime > 0) {
          console.log(`⏳ All keys rate limited. Waiting ${Math.ceil(waitTime / 1000)}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
        }
      }
    }
    
    // Check if we've exceeded the per-minute rate limit for current key
    if (stats.callCount >= this.rateLimit.callsPerMinute) {
      const waitTime = 60000 - (now - stats.lastCallTime);
      if (waitTime > 0) {
        console.log(`Rate limit approaching for key ${this.currentKeyIndex + 1}. Waiting ${Math.ceil(waitTime / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        stats.callCount = 0;
      }
    }
    
    stats.callCount++;
    stats.lastCallTime = now;
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
   * Make API call to Alpha Vantage with error handling and automatic key rotation
   */
  async makeApiCall(params, retryCount = 0) {
    await this.checkRateLimit();
    
    const apiKey = this.getCurrentApiKey();
    const url = new URL(this.baseUrl);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    url.searchParams.append('apikey', apiKey);

    try {
      // Don't log full URL (contains API key)
      console.log(`📡 API call using key ${this.currentKeyIndex + 1}: ${params.function} for ${params.symbol || 'N/A'}`);
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for API error messages
      if (data['Error Message']) {
        throw new Error(`API Error: ${data['Error Message']}`);
      }
      
      // Check for rate limit notice (this is how Alpha Vantage indicates rate limiting)
      if (data['Note']) {
        const note = data['Note'];
        // Check if it's a rate limit message
        if (note.toLowerCase().includes('call frequency') || 
            note.toLowerCase().includes('api call volume') ||
            note.toLowerCase().includes('thank you for using alpha vantage')) {
          
          console.log(`⛔ Rate limit detected for key ${this.currentKeyIndex + 1}: ${note}`);
          this.markKeyRateLimited(this.currentKeyIndex);
          
          // Try to switch to another key and retry
          if (this.enableKeyRotation && this.apiKeys.length > 1 && retryCount < this.apiKeys.length) {
            if (this.switchToNextKey()) {
              console.log(`🔄 Retrying with different API key...`);
              return this.makeApiCall(params, retryCount + 1);
            }
          }
          
          throw new Error(`Rate limit reached. ${note}`);
        }
        throw new Error(`API Note: ${note}`);
      }
      
      return data;
    } catch (error) {
      // If it's a rate limit error and we haven't exhausted retries, try next key
      if (error.message.includes('Rate limit') && 
          this.enableKeyRotation && 
          this.apiKeys.length > 1 && 
          retryCount < this.apiKeys.length) {
        
        if (this.switchToNextKey()) {
          console.log(`🔄 Retrying with different API key due to: ${error.message}`);
          return this.makeApiCall(params, retryCount + 1);
        }
      }
      
      console.error(`❌ API call failed (key ${this.currentKeyIndex + 1}):`, error.message);
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

