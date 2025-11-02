/**
 * StrategyService - Pre-built trading strategies
 * Trend Following, Mean Reversion, Momentum, Conservative
 */

const Strategy = require('../models/Strategy');

class StrategyService {
  constructor() {
    this.strategies = new Map();
    this.initializeStrategies();
  }

  /**
   * Initialize all pre-built strategies
   */
  initializeStrategies() {
    // Trend Following Strategy
    this.strategies.set('trend_following', new Strategy(
      'Trend Following',
      [
        { type: 'SMA', params: { window: 50 } },
        { type: 'SMA', params: { window: 200 } }
      ],
      'Price > SMA50 AND SMA50 > SMA200',
      'Price < SMA50 OR SMA50 < SMA200',
      'weekly'
    ));

    // Mean Reversion Strategy
    this.strategies.set('mean_reversion', new Strategy(
      'Mean Reversion',
      [
        { type: 'RSI', params: { window: 14, overbought: 70, oversold: 30 } },
        { type: 'BOLLINGER', params: { window: 20, multiplier: 2 } }
      ],
      'RSI < 30 OR Price < Lower Bollinger Band',
      'RSI > 70 OR Price > Upper Bollinger Band',
      'daily'
    ));

    // Momentum Strategy
    this.strategies.set('momentum', new Strategy(
      'Momentum',
      [
        { type: 'MACD', params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } },
        { type: 'EMA', params: { window: 12 } },
        { type: 'RSI', params: { window: 14, overbought: 80, oversold: 20 } }
      ],
      'MACD bullish crossover AND RSI > 50',
      'MACD bearish crossover OR RSI < 50',
      'weekly'
    ));

    // Conservative Strategy
    this.strategies.set('conservative', new Strategy(
      'Conservative',
      [
        { type: 'SMA', params: { window: 50 } },
        { type: 'RSI', params: { window: 14, overbought: 75, oversold: 25 } },
        { type: 'BOLLINGER', params: { window: 20, multiplier: 2 } }
      ],
      'Price > SMA50 AND RSI < 60 AND Price < Middle Bollinger Band',
      'Price < SMA50 OR RSI > 80 OR Price > Upper Bollinger Band',
      'monthly'
    ));
  }

  /**
   * Get strategy by name
   * @param {string} name - Strategy name
   * @returns {Strategy|null} Strategy object or null
   */
  getStrategy(name) {
    return this.strategies.get(name) || null;
  }

  /**
   * Get all available strategies
   * @returns {Array<Object>} Array of strategy info
   */
  getAvailableStrategies() {
    const strategies = [];
    for (const [key, strategy] of this.strategies) {
      strategies.push({
        key,
        name: strategy.name,
        description: strategy.getStrategyDescription(),
        frequency: strategy.rebalance_freq,
        indicators: strategy.indicators.map(ind => ind.type)
      });
    }
    return strategies;
  }

  /**
   * Recommend strategy based on portfolio characteristics
   * @param {Object} portfolioInfo - Portfolio information
   * @returns {Object} Strategy recommendation
   */
  recommendStrategy(portfolioInfo) {
    const { horizon, riskTolerance, portfolioSize } = portfolioInfo;
    
    let recommendedStrategy = 'conservative'; // Default
    let confidence = 0.5;

    // Short horizon (1 year) - more aggressive strategies
    if (horizon <= 1) {
      if (riskTolerance === 'high') {
        recommendedStrategy = 'momentum';
        confidence = 0.8;
      } else {
        recommendedStrategy = 'trend_following';
        confidence = 0.7;
      }
    }
    // Medium horizon (2 years) - balanced strategies
    else if (horizon <= 2) {
      if (riskTolerance === 'high') {
        recommendedStrategy = 'trend_following';
        confidence = 0.7;
      } else if (riskTolerance === 'medium') {
        recommendedStrategy = 'mean_reversion';
        confidence = 0.6;
      } else {
        recommendedStrategy = 'conservative';
        confidence = 0.8;
      }
    }
    // Long horizon (5 years) - conservative strategies
    else {
      if (riskTolerance === 'high') {
        recommendedStrategy = 'trend_following';
        confidence = 0.6;
      } else {
        recommendedStrategy = 'conservative';
        confidence = 0.9;
      }
    }

    const strategy = this.getStrategy(recommendedStrategy);
    const frequency = strategy.recommend_frequency(horizon, portfolioSize);

    return {
      strategy: recommendedStrategy,
      strategyObject: strategy,
      frequency,
      confidence,
      reasoning: this.generateRecommendationReasoning(portfolioInfo, recommendedStrategy)
    };
  }

  /**
   * Generate reasoning for strategy recommendation
   * @param {Object} portfolioInfo - Portfolio information
   * @param {string} strategyName - Recommended strategy
   * @returns {string} Reasoning text
   */
  generateRecommendationReasoning(portfolioInfo, strategyName) {
    const { horizon, riskTolerance } = portfolioInfo;
    
    const reasons = [];
    
    // Horizon-based reasoning
    if (horizon <= 1) {
      reasons.push('Short-term horizon requires active management');
    } else if (horizon <= 2) {
      reasons.push('Medium-term horizon allows for balanced approach');
    } else {
      reasons.push('Long-term horizon favors conservative strategies');
    }

    // Risk tolerance reasoning
    if (riskTolerance === 'high') {
      reasons.push('High risk tolerance allows for aggressive strategies');
    } else if (riskTolerance === 'medium') {
      reasons.push('Medium risk tolerance suggests balanced approach');
    } else {
      reasons.push('Low risk tolerance requires conservative strategies');
    }

    // Strategy-specific reasoning
    const strategyReasons = {
      'trend_following': 'Trend following works well in trending markets',
      'mean_reversion': 'Mean reversion captures short-term price reversals',
      'momentum': 'Momentum strategies capitalize on market momentum',
      'conservative': 'Conservative approach minimizes risk and volatility'
    };

    reasons.push(strategyReasons[strategyName] || 'Strategy selected based on portfolio characteristics');

    return reasons.join('. ');
  }

  /**
   * Generate signals for all strategies
   * @param {Map<string, Array>} priceData - Map of ticker -> price data
   * @returns {Map<string, Map>} Map of strategy -> signals
   */
  generateAllStrategySignals(priceData) {
    const allSignals = new Map();

    for (const [strategyName, strategy] of this.strategies) {
      try {
        const signals = strategy.generate_signals(priceData);
        allSignals.set(strategyName, signals);
      } catch (error) {
        console.warn(`Failed to generate signals for ${strategyName}:`, error.message);
        allSignals.set(strategyName, new Map());
      }
    }

    return allSignals;
  }

  /**
   * Compare strategy performance
   * @param {Map<string, Array>} priceData - Map of ticker -> price data
   * @returns {Object} Strategy comparison results
   */
  compareStrategies(priceData) {
    const allSignals = this.generateAllStrategySignals(priceData);
    const comparison = {};

    for (const [strategyName, signals] of allSignals) {
      const signalCounts = { buy: 0, hold: 0, sell: 0 };
      let totalConfidence = 0;
      let signalCount = 0;

      for (const [ticker, signal] of signals) {
        signalCounts[signal.signal]++;
        totalConfidence += signal.confidence;
        signalCount++;
      }

      comparison[strategyName] = {
        signalDistribution: signalCounts,
        averageConfidence: signalCount > 0 ? totalConfidence / signalCount : 0,
        totalSignals: signalCount,
        buyRatio: signalCount > 0 ? signalCounts.buy / signalCount : 0,
        sellRatio: signalCount > 0 ? signalCounts.sell / signalCount : 0
      };
    }

    return comparison;
  }

  /**
   * Get strategy performance summary
   * @param {string} strategyName - Strategy name
   * @param {Map<string, Array>} priceData - Map of ticker -> price data
   * @returns {Object} Performance summary
   */
  getStrategyPerformance(strategyName, priceData) {
    const strategy = this.getStrategy(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    const signals = strategy.generate_signals(priceData);
    const signalCounts = { buy: 0, hold: 0, sell: 0 };
    let totalConfidence = 0;
    let signalCount = 0;

    for (const [ticker, signal] of signals) {
      signalCounts[signal.signal]++;
      totalConfidence += signal.confidence;
      signalCount++;
    }

    return {
      strategy: strategyName,
      totalSignals: signalCount,
      signalDistribution: signalCounts,
      averageConfidence: signalCount > 0 ? totalConfidence / signalCount : 0,
      buySignals: signalCounts.buy,
      sellSignals: signalCounts.sell,
      holdSignals: signalCounts.hold,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Create custom strategy
   * @param {string} name - Strategy name
   * @param {Array} indicators - Indicator configurations
   * @param {string} entryRule - Entry rule description
   * @param {string} exitRule - Exit rule description
   * @param {string} frequency - Rebalancing frequency
   * @returns {Strategy} Custom strategy
   */
  createCustomStrategy(name, indicators, entryRule, exitRule, frequency = 'weekly') {
    const strategy = new Strategy(name, indicators, entryRule, exitRule, frequency);
    this.strategies.set(name.toLowerCase().replace(/\s+/g, '_'), strategy);
    return strategy;
  }

  /**
   * Get strategy statistics
   * @returns {Object} Strategy statistics
   */
  getStrategyStatistics() {
    return {
      totalStrategies: this.strategies.size,
      strategies: Array.from(this.strategies.keys()),
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = StrategyService;





