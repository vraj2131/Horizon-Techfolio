/**
 * Strategy - Combines multiple technical indicator signals with trading rules
 * State: name, indicators[], entry_rule, exit_rule, rebalance_freq
 * Actions: generate_signals(prices), recommend_frequency(), explain()
 */

const { IndicatorService } = require('../services/IndicatorService');

class Strategy {
  constructor(name, indicators = [], entryRule = null, exitRule = null, rebalanceFreq = 'weekly') {
    this.name = name;
    this.indicators = indicators; // Array of indicator configurations
    this.entryRule = entryRule;
    this.exitRule = exitRule;
    this.rebalance_freq = rebalanceFreq;
    this.lastSignals = new Map(); // Cache for last generated signals
  }

  /**
   * Generate trading signals for all securities in portfolio
   * @param {Map<string, Array>} priceData - Map of ticker -> price data
   * @returns {Map<string, Object>} Map of ticker -> signal object
   */
  generate_signals(priceData) {
    const signals = new Map();

    for (const [ticker, data] of priceData) {
      try {
        const signal = this.calculateSignalForTicker(ticker, data);
        signals.set(ticker, signal);
      } catch (error) {
        console.warn(`Failed to generate signal for ${ticker}:`, error.message);
        signals.set(ticker, {
          ticker,
          signal: 'hold',
          confidence: 0,
          reason: 'Error calculating signal',
          indicators: {}
        });
      }
    }

    this.lastSignals = signals;
    return signals;
  }

  /**
   * Calculate signal for a specific ticker
   * @param {string} ticker - Stock ticker
   * @param {Array} priceData - Price data for the ticker
   * @returns {Object} Signal object
   */
  calculateSignalForTicker(ticker, priceData) {
    const indicatorResults = {};
    const indicatorSignals = {};

    // Calculate all required indicators
    for (const indicatorConfig of this.indicators) {
      try {
        const indicator = IndicatorService.createIndicator(
          indicatorConfig.type, 
          indicatorConfig.params
        );
        
        const values = indicator.compute(priceData);
        const signals = indicator.getAllSignals();
        
        indicatorResults[indicatorConfig.type] = {
          values: values,
          signals: signals,
          metadata: indicator.getMetadata()
        };
        
        indicatorSignals[indicatorConfig.type] = signals;
      } catch (error) {
        console.warn(`Failed to calculate ${indicatorConfig.type} for ${ticker}:`, error.message);
        indicatorSignals[indicatorConfig.type] = ['hold'];
        indicatorResults[indicatorConfig.type] = {
          error: error.message,
          values: [],
          signals: ['hold'],
          metadata: { type: indicatorConfig.type, error: true }
        };
      }
    }

    // Apply entry and exit rules
    const finalSignal = this.applyRules(indicatorSignals, priceData);
    const confidence = this.calculateConfidence(indicatorSignals, priceData);
    const reason = this.generateReason(finalSignal, indicatorSignals);

    return {
      ticker,
      signal: finalSignal,
      confidence,
      reason,
      indicators: indicatorResults,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Apply entry and exit rules to determine final signal
   * @param {Object} indicatorSignals - Signals from all indicators
   * @param {Array} priceData - Price data
   * @returns {string} Final signal ('buy', 'hold', 'sell')
   */
  applyRules(indicatorSignals, priceData) {
    if (this.entryRule && this.exitRule) {
      return this.applyCustomRules(indicatorSignals, priceData);
    }

    // Default rule: majority vote
    return this.applyMajorityVote(indicatorSignals);
  }

  /**
   * Apply custom entry and exit rules
   * @param {Object} indicatorSignals - Signals from all indicators
   * @param {Array} priceData - Price data
   * @returns {string} Final signal
   */
  applyCustomRules(indicatorSignals, priceData) {
    // This would be implemented based on specific strategy rules
    // For now, fall back to majority vote
    return this.applyMajorityVote(indicatorSignals);
  }

  /**
   * Apply majority vote rule
   * @param {Object} indicatorSignals - Signals from all indicators
   * @returns {string} Final signal
   */
  applyMajorityVote(indicatorSignals) {
    const signalCounts = { buy: 0, hold: 0, sell: 0 };
    
    for (const [indicatorType, signals] of Object.entries(indicatorSignals)) {
      if (signals.length > 0) {
        const latestSignal = signals[signals.length - 1];
        signalCounts[latestSignal]++;
      }
    }

    // Return the signal with highest count
    const maxCount = Math.max(...Object.values(signalCounts));
    for (const [signal, count] of Object.entries(signalCounts)) {
      if (count === maxCount) {
        return signal;
      }
    }

    return 'hold';
  }

  /**
   * Calculate signal confidence (0-1)
   * @param {Object} indicatorSignals - Signals from all indicators
   * @param {Array} priceData - Price data
   * @returns {number} Confidence level
   */
  calculateConfidence(indicatorSignals, priceData) {
    let totalConfidence = 0;
    let indicatorCount = 0;

    for (const [indicatorType, signals] of Object.entries(indicatorSignals)) {
      if (signals.length > 0) {
        // Simple confidence based on signal consistency
        const latestSignal = signals[signals.length - 1];
        const signalCount = signals.filter(s => s === latestSignal).length;
        const confidence = signalCount / signals.length;
        totalConfidence += confidence;
        indicatorCount++;
      }
    }

    return indicatorCount > 0 ? totalConfidence / indicatorCount : 0.5;
  }

  /**
   * Generate human-readable reason for signal
   * @param {string} signal - Final signal
   * @param {Object} indicatorSignals - Signals from all indicators
   * @returns {string} Reason text
   */
  generateReason(signal, indicatorSignals) {
    const reasons = [];
    
    for (const [indicatorType, signals] of Object.entries(indicatorSignals)) {
      if (signals.length > 0) {
        const latestSignal = signals[signals.length - 1];
        if (latestSignal === signal) {
          reasons.push(`${indicatorType} shows ${signal} signal`);
        }
      }
    }

    if (reasons.length === 0) {
      return `No clear signals from indicators, defaulting to ${signal}`;
    }

    return reasons.join(', ');
  }

  /**
   * Recommend optimal trading frequency
   * @param {number} horizon - Investment horizon in years
   * @param {number} portfolioSize - Number of positions
   * @returns {string} Recommended frequency ('daily', 'weekly', 'monthly')
   */
  recommend_frequency(horizon = 2, portfolioSize = 20) {
    // Base frequency on strategy type and horizon
    if (this.name.toLowerCase().includes('mean reversion')) {
      return 'daily'; // Mean reversion strategies need frequent monitoring
    }
    
    if (this.name.toLowerCase().includes('conservative')) {
      return 'monthly'; // Conservative strategies can be less frequent
    }
    
    // Default logic based on horizon and portfolio size
    if (horizon <= 1) {
      return 'weekly'; // Short horizon needs more frequent rebalancing
    } else if (horizon <= 2) {
      return 'weekly'; // Medium horizon
    } else {
      return 'monthly'; // Long horizon can be less frequent
    }
  }

  /**
   * Explain the strategy
   * @returns {Object} Strategy explanation
   */
  explain() {
    return {
      name: this.name,
      description: this.getStrategyDescription(),
      indicators: this.indicators.map(ind => ({
        type: ind.type,
        params: ind.params
      })),
      frequency: this.rebalance_freq,
      rules: {
        entry: this.entryRule || 'Majority vote of indicators',
        exit: this.exitRule || 'Majority vote of indicators'
      }
    };
  }

  /**
   * Get strategy description based on name
   * @returns {string} Strategy description
   */
  getStrategyDescription() {
    const descriptions = {
      'Trend Following': 'Uses moving averages to identify and follow market trends',
      'Mean Reversion': 'Identifies overbought/oversold conditions for contrarian trades',
      'Momentum': 'Trades based on price momentum and MACD signals',
      'Conservative': 'Uses multiple indicators with conservative risk management'
    };
    
    return descriptions[this.name] || 'Custom strategy using technical indicators';
  }

  /**
   * Get last generated signals
   * @returns {Map} Last signals
   */
  getLastSignals() {
    return this.lastSignals;
  }

  /**
   * Get signal for specific ticker
   * @param {string} ticker - Stock ticker
   * @returns {Object|null} Signal object or null
   */
  getSignalForTicker(ticker) {
    return this.lastSignals.get(ticker) || null;
  }

  /**
   * Update strategy parameters
   * @param {Object} updates - Parameter updates
   */
  updateStrategy(updates) {
    if (updates.name) this.name = updates.name;
    if (updates.indicators) this.indicators = updates.indicators;
    if (updates.entryRule) this.entryRule = updates.entryRule;
    if (updates.exitRule) this.exitRule = updates.exitRule;
    if (updates.rebalanceFreq) this.rebalance_freq = updates.rebalanceFreq;
  }

  /**
   * String representation of strategy
   * @returns {string} Strategy description
   */
  toString() {
    return `${this.name} Strategy (${this.rebalance_freq} rebalancing)`;
  }
}

module.exports = Strategy;
