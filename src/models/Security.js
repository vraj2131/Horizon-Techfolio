/**
 * Security - Represents a listed common stock
 * State: ticker, name, exchange, sector, inception_date
 * Actions: fetch_history(), fetch_quote(), validate_symbol()
 */

const MarketDataProvider = require('../services/MarketDataProvider');

class Security {
  constructor(ticker, name = null, exchange = null, sector = null, inception_date = null) {
    this.ticker = ticker.toUpperCase();
    this.name = name;
    this.exchange = exchange;
    this.sector = sector;
    this.inception_date = inception_date;
    this.marketDataProvider = new MarketDataProvider();
  }

  /**
   * Fetch historical price data for this security
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} interval - Data interval (daily, weekly, monthly)
   * @returns {Promise<Array>} Array of price data points
   */
  async fetch_history(startDate, endDate, interval = 'daily') {
    try {
      console.log(`Fetching historical data for ${this.ticker} from ${startDate} to ${endDate}`);
      const priceData = await this.marketDataProvider.get_prices(
        this.ticker, 
        startDate, 
        endDate, 
        interval
      );
      
      if (!priceData || priceData.length === 0) {
        throw new Error(`No historical data found for ${this.ticker} in the specified date range`);
      }
      
      console.log(`Retrieved ${priceData.length} data points for ${this.ticker}`);
      return priceData;
    } catch (error) {
      console.error(`Failed to fetch history for ${this.ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch current quote for this security
   * @returns {Promise<Object>} Current quote data
   */
  async fetch_quote() {
    try {
      console.log(`Fetching current quote for ${this.ticker}`);
      const quote = await this.marketDataProvider.get_quote(this.ticker);
      console.log(`Current price for ${this.ticker}: $${quote.price}`);
      return quote;
    } catch (error) {
      console.error(`Failed to fetch quote for ${this.ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate if this security's ticker symbol exists and fetch metadata
   * @returns {Promise<boolean>} True if valid, false otherwise
   */
  async validate_symbol() {
    try {
      console.log(`Validating symbol ${this.ticker}`);
      
      // First validate the symbol exists
      const isValid = await this.marketDataProvider.validate_symbol(this.ticker);
      
      if (isValid) {
        // If valid, try to fetch additional metadata
        try {
          await this.fetch_metadata();
        } catch (metadataError) {
          console.warn(`Could not fetch metadata for ${this.ticker}:`, metadataError.message);
          // Continue even if metadata fetch fails
        }
      }
      
      console.log(`Symbol ${this.ticker} is ${isValid ? 'valid' : 'invalid'}`);
      return isValid;
    } catch (error) {
      console.error(`Failed to validate symbol ${this.ticker}:`, error.message);
      return false;
    }
  }

  /**
   * Fetch additional metadata for the security
   * @returns {Promise<void>}
   */
  async fetch_metadata() {
    try {
      // For now, we'll set some basic defaults since Alpha Vantage doesn't provide
      // company metadata in the free tier. In a real implementation, you might
      // use another API or database to get this information.
      
      // Set basic defaults based on common patterns
      this.name = this.getDefaultName();
      this.exchange = this.getDefaultExchange();
      this.sector = this.getDefaultSector();
      this.inception_date = this.getDefaultInceptionDate();
      
    } catch (error) {
      console.warn(`Failed to fetch metadata for ${this.ticker}:`, error.message);
    }
  }

  /**
   * Get default name based on ticker
   * @returns {string} Default company name
   */
  getDefaultName() {
    const nameMap = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'NFLX': 'Netflix Inc.',
      'GOOG': 'Alphabet Inc.',
      'BRK.B': 'Berkshire Hathaway Inc.'
    };
    
    return nameMap[this.ticker] || `${this.ticker} Inc.`;
  }

  /**
   * Get default exchange based on ticker
   * @returns {string} Default exchange
   */
  getDefaultExchange() {
    // Most major US stocks are on NASDAQ or NYSE
    const nasdaqTickers = ['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    return nasdaqTickers.includes(this.ticker) ? 'NASDAQ' : 'NYSE';
  }

  /**
   * Get default sector based on ticker
   * @returns {string} Default sector
   */
  getDefaultSector() {
    const sectorMap = {
      'AAPL': 'Technology',
      'MSFT': 'Technology',
      'GOOGL': 'Technology',
      'GOOG': 'Technology',
      'AMZN': 'Consumer Discretionary',
      'TSLA': 'Consumer Discretionary',
      'META': 'Technology',
      'NVDA': 'Technology',
      'NFLX': 'Communication Services',
      'BRK.B': 'Financial Services'
    };
    
    return sectorMap[this.ticker] || 'Technology';
  }

  /**
   * Get default inception date
   * @returns {string} Default inception date
   */
  getDefaultInceptionDate() {
    // Return a reasonable default date (e.g., 10 years ago)
    const date = new Date();
    date.setFullYear(date.getFullYear() - 10);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get security metadata
   * @returns {Object} Security information
   */
  get_metadata() {
    return {
      ticker: this.ticker,
      name: this.name,
      exchange: this.exchange,
      sector: this.sector,
      inception_date: this.inception_date
    };
  }

  /**
   * Update security metadata
   * @param {Object} metadata - Updated metadata
   */
  update_metadata(metadata) {
    if (metadata.name) this.name = metadata.name;
    if (metadata.exchange) this.exchange = metadata.exchange;
    if (metadata.sector) this.sector = metadata.sector;
    if (metadata.inception_date) this.inception_date = metadata.inception_date;
  }

  /**
   * Get a string representation of the security
   * @returns {string} Security description
   */
  toString() {
    return `${this.ticker}${this.name ? ` (${this.name})` : ''}${this.sector ? ` - ${this.sector}` : ''}`;
  }

  /**
   * Check if security has sufficient data for analysis
   * @param {Array} priceData - Historical price data
   * @param {number} minDataPoints - Minimum required data points
   * @returns {boolean} True if sufficient data
   */
  has_sufficient_data(priceData, minDataPoints = 50) {
    return !!(priceData && Array.isArray(priceData) && priceData.length >= minDataPoints);
  }

  /**
   * Get the most recent price from historical data
   * @param {Array} priceData - Historical price data
   * @returns {number|null} Most recent close price
   */
  get_latest_price(priceData) {
    if (!priceData || priceData.length === 0) {
      return null;
    }
    return priceData[priceData.length - 1].close;
  }

  /**
   * Calculate price change over a period
   * @param {Array} priceData - Historical price data
   * @param {number} days - Number of days to look back
   * @returns {number|null} Price change percentage
   */
  calculate_price_change(priceData, days = 1) {
    if (!priceData || priceData.length < days + 1) {
      return null;
    }
    
    const currentPrice = priceData[priceData.length - 1].close;
    const pastPrice = priceData[priceData.length - 1 - days].close;
    
    if (pastPrice === 0) {
      return null;
    }
    
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }
}

module.exports = Security;
