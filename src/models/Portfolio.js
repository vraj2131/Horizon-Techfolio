/**
 * Portfolio - Represents complete collection of investor's holdings
 * State: positions[], cash, horizon (1/2/5 years), risk_budget
 * Actions: rebalance(target_weights), mark_to_market(quotes), performance()
 */

const Position = require('./Position');
const config = require('../../config/config');

class Portfolio {
  constructor(securities, horizon = 2, initialCash = null) {
    this.positions = new Map(); // Map of ticker -> Position
    this.cash = initialCash || config.trading.initialCapital;
    this.horizon = horizon; // Investment horizon in years
    this.risk_budget = 1.0; // Risk budget (0.0 to 1.0)
    this.createdAt = new Date();
    this.lastUpdated = new Date();
    
    // Initialize empty positions for all securities
    this.initializePositions(securities);
  }

  /**
   * Initialize empty positions for all securities
   * @param {Array<Security>} securities - Array of Security objects
   */
  initializePositions(securities) {
    for (const security of securities) {
      const position = new Position(security, 'long', 0, 0);
      this.positions.set(security.ticker, position);
    }
    console.log(`Initialized portfolio with ${securities.length} securities`);
  }

  /**
   * Get position for a specific ticker
   * @param {string} ticker - Stock ticker
   * @returns {Position|null} Position object or null if not found
   */
  getPosition(ticker) {
    return this.positions.get(ticker.toUpperCase()) || null;
  }

  /**
   * Add a new security to the portfolio
   * @param {Security} security - Security object
   */
  addSecurity(security) {
    if (this.positions.has(security.ticker)) {
      console.log(`Security ${security.ticker} already exists in portfolio`);
      return;
    }
    
    const position = new Position(security, 'long', 0, 0);
    this.positions.set(security.ticker, position);
    console.log(`Added ${security.ticker} to portfolio`);
  }

  /**
   * Remove a security from the portfolio
   * @param {string} ticker - Stock ticker
   */
  removeSecurity(ticker) {
    const position = this.getPosition(ticker);
    if (position && !position.isEmpty()) {
      throw new Error(`Cannot remove ${ticker} - position not empty`);
    }
    
    this.positions.delete(ticker.toUpperCase());
    console.log(`Removed ${ticker} from portfolio`);
  }

  /**
   * Execute a trade (buy or sell)
   * @param {string} ticker - Stock ticker
   * @param {string} side - 'buy' or 'sell'
   * @param {number} shares - Number of shares
   * @param {number} price - Price per share
   * @param {number} commission - Commission per trade (default from config)
   */
  executeTrade(ticker, side, shares, price, commission = null) {
    const position = this.getPosition(ticker);
    if (!position) {
      throw new Error(`Position not found for ${ticker}`);
    }

    const tradeCommission = commission || (price * shares * config.trading.commission);
    const totalCost = price * shares + tradeCommission;

    if (side.toLowerCase() === 'buy') {
      if (totalCost > this.cash) {
        throw new Error(`Insufficient cash. Required: $${totalCost.toFixed(2)}, Available: $${this.cash.toFixed(2)}`);
      }
      
      position.increase(shares, price);
      this.cash -= totalCost;
      console.log(`Bought ${shares} shares of ${ticker} at $${price} (commission: $${tradeCommission.toFixed(2)})`);
    } else if (side.toLowerCase() === 'sell') {
      if (shares > position.shares) {
        throw new Error(`Cannot sell ${shares} shares - only ${position.shares} available`);
      }
      
      const realizedPnl = position.decrease(shares, price);
      this.cash += (price * shares - tradeCommission);
      console.log(`Sold ${shares} shares of ${ticker} at $${price} (commission: $${tradeCommission.toFixed(2)}, realized P&L: $${realizedPnl.toFixed(2)})`);
    } else {
      throw new Error('Side must be "buy" or "sell"');
    }

    this.lastUpdated = new Date();
  }

  /**
   * Mark portfolio to market using current quotes
   * @param {Array<Object>} quotes - Array of quote objects with ticker and price
   */
  mark_to_market(quotes) {
    const quoteMap = new Map();
    quotes.forEach(quote => {
      quoteMap.set(quote.symbol || quote.ticker, quote.price);
    });

    let totalValue = this.cash;
    let totalCostBasis = 0;

    for (const [ticker, position] of this.positions) {
      const currentPrice = quoteMap.get(ticker);
      if (currentPrice !== undefined) {
        position.updateUnrealizedPnl(currentPrice);
        totalValue += position.getMarketValue(currentPrice);
        totalCostBasis += position.getCostBasis();
      }
    }

    this.lastUpdated = new Date();
    return {
      totalValue,
      totalCostBasis,
      cash: this.cash,
      unrealizedPnl: totalValue - this.cash - totalCostBasis,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Rebalance portfolio to target weights
   * @param {Object} target_weights - Object with ticker -> weight (0.0 to 1.0)
   * @param {Object} currentPrices - Object with ticker -> current price
   */
  rebalance(target_weights, currentPrices) {
    const currentValue = this.mark_to_market(Object.values(currentPrices).map(price => ({ price }))).totalValue;
    const trades = [];

    console.log(`Rebalancing portfolio to target weights (total value: $${currentValue.toFixed(2)})`);

    for (const [ticker, targetWeight] of Object.entries(target_weights)) {
      const position = this.getPosition(ticker);
      if (!position) {
        console.warn(`Position not found for ${ticker}, skipping`);
        continue;
      }

      const currentPrice = currentPrices[ticker];
      if (!currentPrice) {
        console.warn(`Current price not found for ${ticker}, skipping`);
        continue;
      }

      const currentValue = position.getMarketValue(currentPrice);
      const currentWeight = currentValue / this.mark_to_market(Object.values(currentPrices).map(price => ({ price }))).totalValue;
      const targetValue = targetWeight * this.mark_to_market(Object.values(currentPrices).map(price => ({ price }))).totalValue;
      const difference = targetValue - currentValue;

      if (Math.abs(difference) > 100) { // Minimum trade size of $100
        const sharesToTrade = Math.floor(Math.abs(difference) / currentPrice);
        const side = difference > 0 ? 'buy' : 'sell';

        try {
          this.executeTrade(ticker, side, sharesToTrade, currentPrice);
          trades.push({
            ticker,
            side,
            shares: sharesToTrade,
            price: currentPrice,
            value: sharesToTrade * currentPrice
          });
        } catch (error) {
          console.warn(`Failed to execute trade for ${ticker}: ${error.message}`);
        }
      }
    }

    console.log(`Rebalancing completed with ${trades.length} trades`);
    return trades;
  }

  /**
   * Calculate portfolio performance metrics
   * @param {Array<Object>} quotes - Array of current quotes
   * @returns {Object} Performance metrics
   */
  performance(quotes = null) {
    const marketData = quotes ? this.mark_to_market(quotes) : this.mark_to_market([]);
    
    const totalReturn = this.cash > 0 ? (marketData.totalValue - config.trading.initialCapital) / config.trading.initialCapital : 0;
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / this.horizon) - 1;

    return {
      totalValue: marketData.totalValue,
      totalReturn: totalReturn,
      annualizedReturn: annualizedReturn,
      cash: this.cash,
      unrealizedPnl: marketData.unrealizedPnl,
      horizon: this.horizon,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Get portfolio summary
   * @param {Array<Object>} quotes - Array of current quotes
   * @returns {Object} Portfolio summary
   */
  getSummary(quotes = null) {
    const marketData = quotes ? this.mark_to_market(quotes) : this.mark_to_market([]);
    const performance = this.performance(quotes);
    
    const positions = [];
    for (const [ticker, position] of this.positions) {
      const currentPrice = quotes ? quotes.find(q => q.symbol === ticker || q.ticker === ticker)?.price : null;
      positions.push(position.getSummary(currentPrice));
    }

    return {
      portfolioId: this.createdAt.getTime().toString(),
      horizon: this.horizon,
      totalValue: marketData.totalValue,
      cash: this.cash,
      performance,
      positions,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Clone portfolio for backtesting
   * @returns {Portfolio} New portfolio instance
   */
  clone() {
    const clonedPortfolio = new Portfolio([], this.horizon, this.cash);
    clonedPortfolio.risk_budget = this.risk_budget;
    clonedPortfolio.createdAt = this.createdAt;
    clonedPortfolio.lastUpdated = this.lastUpdated;

    for (const [ticker, position] of this.positions) {
      clonedPortfolio.positions.set(ticker, position.clone());
    }

    return clonedPortfolio;
  }

  /**
   * Get all tickers in portfolio
   * @returns {Array<string>} Array of tickers
   */
  getTickers() {
    return Array.from(this.positions.keys());
  }

  /**
   * Check if portfolio is empty
   * @returns {boolean} True if no positions have shares
   */
  isEmpty() {
    for (const position of this.positions.values()) {
      if (!position.isEmpty()) {
        return false;
      }
    }
    return true;
  }

  /**
   * String representation of portfolio
   * @returns {string} Portfolio description
   */
  toString() {
    const nonEmptyPositions = Array.from(this.positions.values()).filter(p => !p.isEmpty());
    return `Portfolio (${this.horizon}yr): ${nonEmptyPositions.length} positions, $${this.cash.toFixed(2)} cash`;
  }
}

module.exports = Portfolio;




