/**
 * Position - Represents investor's stake in a single security
 * State: security, side (long/short), shares, avg_cost, pnl_unrealized
 * Actions: increase(qty, price), decrease(qty, price), close()
 */

class Position {
  constructor(security, side = 'long', shares = 0, avg_cost = 0) {
    this.security = security; // Security object
    this.side = side; // 'long' or 'short'
    this.shares = shares; // Number of shares
    this.avg_cost = avg_cost; // Average cost per share
    this.pnl_unrealized = 0; // Unrealized profit/loss
  }

  /**
   * Increase position size (buy more shares)
   * @param {number} qty - Quantity to add
   * @param {number} price - Price per share
   */
  increase(qty, price) {
    if (qty <= 0) {
      throw new Error('Quantity must be positive');
    }
    if (price <= 0) {
      throw new Error('Price must be positive');
    }

    const totalCost = this.shares * this.avg_cost + qty * price;
    const totalShares = this.shares + qty;
    
    this.avg_cost = totalCost / totalShares;
    this.shares = totalShares;
    
    console.log(`Increased ${this.security.ticker} position: +${qty} shares at $${price}, new avg cost: $${this.avg_cost.toFixed(2)}`);
  }

  /**
   * Decrease position size (sell shares)
   * @param {number} qty - Quantity to remove
   * @param {number} price - Price per share
   * @returns {number} Realized P&L from this transaction
   */
  decrease(qty, price) {
    if (qty <= 0) {
      throw new Error('Quantity must be positive');
    }
    if (qty > this.shares) {
      throw new Error('Cannot sell more shares than owned');
    }
    if (price <= 0) {
      throw new Error('Price must be positive');
    }

    const realizedPnl = this.side === 'long' 
      ? (price - this.avg_cost) * qty
      : (this.avg_cost - price) * qty;
    
    this.shares -= qty;
    
    console.log(`Decreased ${this.security.ticker} position: -${qty} shares at $${price}, realized P&L: $${realizedPnl.toFixed(2)}`);
    
    return realizedPnl;
  }

  /**
   * Close entire position
   * @param {number} price - Current market price
   * @returns {number} Total realized P&L
   */
  close(price) {
    if (this.shares === 0) {
      return 0;
    }

    const realizedPnl = this.decrease(this.shares, price);
    console.log(`Closed ${this.security.ticker} position: realized P&L: $${realizedPnl.toFixed(2)}`);
    
    return realizedPnl;
  }

  /**
   * Update unrealized P&L based on current market price
   * @param {number} currentPrice - Current market price
   */
  updateUnrealizedPnl(currentPrice) {
    if (this.shares === 0) {
      this.pnl_unrealized = 0;
      return;
    }

    this.pnl_unrealized = this.side === 'long'
      ? (currentPrice - this.avg_cost) * this.shares
      : (this.avg_cost - currentPrice) * this.shares;
  }

  /**
   * Get current market value of position
   * @param {number} currentPrice - Current market price
   * @returns {number} Market value
   */
  getMarketValue(currentPrice) {
    return this.shares * currentPrice;
  }

  /**
   * Get total cost basis of position
   * @returns {number} Total cost
   */
  getCostBasis() {
    return this.shares * this.avg_cost;
  }

  /**
   * Get position weight in portfolio
   * @param {number} currentPrice - Current market price
   * @param {number} totalPortfolioValue - Total portfolio value
   * @returns {number} Weight as percentage
   */
  getWeight(currentPrice, totalPortfolioValue) {
    if (totalPortfolioValue === 0) return 0;
    return (this.getMarketValue(currentPrice) / totalPortfolioValue) * 100;
  }

  /**
   * Check if position is empty
   * @returns {boolean} True if no shares
   */
  isEmpty() {
    return this.shares === 0;
  }

  /**
   * Get position summary
   * @param {number} currentPrice - Current market price
   * @returns {Object} Position summary
   */
  getSummary(currentPrice = null) {
    const summary = {
      ticker: this.security.ticker,
      side: this.side,
      shares: this.shares,
      avgCost: this.avg_cost,
      costBasis: this.getCostBasis(),
      isEmpty: this.isEmpty()
    };

    if (currentPrice !== null) {
      summary.currentPrice = currentPrice;
      summary.marketValue = this.getMarketValue(currentPrice);
      summary.unrealizedPnl = this.side === 'long'
        ? (currentPrice - this.avg_cost) * this.shares
        : (this.avg_cost - currentPrice) * this.shares;
      summary.returnPercent = this.avg_cost > 0 
        ? ((currentPrice - this.avg_cost) / this.avg_cost) * 100
        : 0;
    }

    return summary;
  }

  /**
   * Clone position for backtesting
   * @returns {Position} New position instance
   */
  clone() {
    const clonedPosition = new Position(this.security, this.side, this.shares, this.avg_cost);
    clonedPosition.pnl_unrealized = this.pnl_unrealized;
    return clonedPosition;
  }

  /**
   * String representation of position
   * @returns {string} Position description
   */
  toString() {
    return `${this.side.toUpperCase()} ${this.shares} shares of ${this.security.ticker} @ $${this.avg_cost.toFixed(2)}`;
  }
}

module.exports = Position;




