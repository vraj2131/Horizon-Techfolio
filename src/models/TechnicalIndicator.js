/**
 * TechnicalIndicator - Base class for technical analysis indicators
 * State: type, window(s), params
 * Actions: compute(series) → values, signal(series) → {buy|hold|sell}
 */

const { calculateSMA, calculateEMA, calculateStdDev, calculateMean } = require('../utils/calculations');

class TechnicalIndicator {
  constructor(type, window, params = {}) {
    this.type = type;
    this.window = window;
    this.params = params;
    this.values = [];
    this.signals = [];
  }

  /**
   * Compute indicator values from price series
   * @param {Array<Object>} priceData - Array of price data points
   * @returns {Array<number>} Indicator values
   */
  compute(priceData) {
    if (!Array.isArray(priceData) || priceData.length === 0) {
      throw new Error('Price data is required');
    }

    if (priceData.length < this.window) {
      throw new Error(`Insufficient data: need at least ${this.window} data points`);
    }

    // Extract close prices
    const closes = priceData.map(point => point.close);
    
    // Compute indicator-specific values
    this.values = this.calculateValues(closes);
    
    // Generate signals
    this.signals = this.generateSignals(priceData, this.values);
    
    return this.values;
  }

  /**
   * Calculate indicator-specific values (to be implemented by subclasses)
   * @param {Array<number>} closes - Array of close prices
   * @returns {Array<number>} Indicator values
   */
  calculateValues(closes) {
    throw new Error('calculateValues must be implemented by subclass');
  }

  /**
   * Generate trading signals based on indicator values
   * @param {Array<Object>} priceData - Array of price data points
   * @param {Array<number>} values - Indicator values
   * @returns {Array<string>} Array of signals ('buy', 'hold', 'sell')
   */
  generateSignals(priceData, values) {
    const signals = [];
    
    for (let i = 0; i < values.length; i++) {
      const signal = this.calculateSignal(priceData, values, i);
      signals.push(signal);
    }
    
    return signals;
  }

  /**
   * Calculate signal for a specific data point (to be implemented by subclasses)
   * @param {Array<Object>} priceData - Array of price data points
   * @param {Array<number>} values - Indicator values
   * @param {number} index - Current index
   * @returns {string} Signal ('buy', 'hold', 'sell')
   */
  calculateSignal(priceData, values, index) {
    throw new Error('calculateSignal must be implemented by subclass');
  }

  /**
   * Get the latest signal
   * @returns {string} Latest signal
   */
  getLatestSignal() {
    if (this.signals.length === 0) {
      return 'hold';
    }
    return this.signals[this.signals.length - 1];
  }

  /**
   * Get signal at specific index
   * @param {number} index - Index of the signal
   * @returns {string} Signal at index
   */
  getSignalAt(index) {
    if (index < 0 || index >= this.signals.length) {
      return 'hold';
    }
    return this.signals[index];
  }

  /**
   * Get all signals
   * @returns {Array<string>} All signals
   */
  getAllSignals() {
    return [...this.signals];
  }

  /**
   * Get indicator values
   * @returns {Array<number>} Indicator values
   */
  getValues() {
    return [...this.values];
  }

  /**
   * Get indicator metadata
   * @returns {Object} Indicator information
   */
  getMetadata() {
    return {
      type: this.type,
      window: this.window,
      params: this.params,
      valueCount: this.values.length,
      signalCount: this.signals.length
    };
  }

  /**
   * Reset indicator state
   */
  reset() {
    this.values = [];
    this.signals = [];
  }

  /**
   * Check if indicator has sufficient data
   * @param {Array<Object>} priceData - Price data to check
   * @returns {boolean} True if sufficient data
   */
  hasSufficientData(priceData) {
    return Array.isArray(priceData) && priceData.length >= this.window;
  }

  /**
   * Get signal strength (confidence level)
   * @param {number} index - Index of the signal
   * @returns {number} Signal strength (0-1)
   */
  getSignalStrength(index) {
    if (index < 0 || index >= this.signals.length) {
      return 0;
    }

    const signal = this.signals[index];
    if (signal === 'hold') {
      return 0.5;
    }

    // Base strength on how far the indicator is from neutral levels
    // This is a simplified implementation - subclasses can override
    return 0.7;
  }

  /**
   * String representation of indicator
   * @returns {string} Indicator description
   */
  toString() {
    return `${this.type}(${this.window})`;
  }
}

module.exports = TechnicalIndicator;

















