/**
 * IndicatorService - Implementation of specific technical indicators
 * SMA, EMA, RSI, MACD, Bollinger Bands with buy/hold/sell signals
 */

const TechnicalIndicator = require('../models/TechnicalIndicator');
const { calculateSMA, calculateEMA, calculateStdDev, calculateMean } = require('../utils/calculations');

/**
 * Simple Moving Average (SMA) Indicator
 */
class SMAIndicator extends TechnicalIndicator {
  constructor(window = 20) {
    super('SMA', window);
  }

  calculateValues(closes) {
    if (closes.length < this.window) {
      throw new Error(`Insufficient data: need at least ${this.window} data points`);
    }
    return calculateSMA(closes, this.window);
  }

  calculateSignal(priceData, values, index) {
    if (index < 1) return 'hold';
    
    const currentPrice = priceData[index + this.window - 1].close;
    const currentSMA = values[index];
    const previousPrice = priceData[index + this.window - 2].close;
    const previousSMA = values[index - 1];
    
    // Price crossing above SMA = buy signal
    if (previousPrice <= previousSMA && currentPrice > currentSMA) {
      return 'buy';
    }
    
    // Price crossing below SMA = sell signal
    if (previousPrice >= previousSMA && currentPrice < currentSMA) {
      return 'sell';
    }
    
    return 'hold';
  }
}

/**
 * Exponential Moving Average (EMA) Indicator
 */
class EMAIndicator extends TechnicalIndicator {
  constructor(window = 12, alpha = null) {
    super('EMA', window, { alpha });
  }

  calculateValues(closes) {
    return calculateEMA(closes, this.window, this.params.alpha);
  }

  calculateSignal(priceData, values, index) {
    if (index < 1) return 'hold';
    
    // EMA values align directly with priceData (same length, starts at index 0)
    const currentPrice = priceData[index].close;
    const currentEMA = values[index];
    const previousPrice = priceData[index - 1].close;
    const previousEMA = values[index - 1];
    
    // Price crossing above EMA = buy signal
    if (previousPrice <= previousEMA && currentPrice > currentEMA) {
      return 'buy';
    }
    
    // Price crossing below EMA = sell signal
    if (previousPrice >= previousEMA && currentPrice < currentEMA) {
      return 'sell';
    }
    
    return 'hold';
  }
}

/**
 * Relative Strength Index (RSI) Indicator
 */
class RSIIndicator extends TechnicalIndicator {
  constructor(window = 14, overbought = 70, oversold = 30) {
    super('RSI', window, { overbought, oversold });
  }

  calculateValues(closes) {
    if (closes.length < this.window + 1) {
      return [];
    }

    const rsi = [];
    const gains = [];
    const losses = [];

    // Calculate price changes
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate initial average gain and loss
    let avgGain = calculateMean(gains.slice(0, this.window));
    let avgLoss = calculateMean(losses.slice(0, this.window));

    // Calculate RSI for the first period
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    // Calculate RSI for remaining periods using Wilder's smoothing
    for (let i = this.window; i < gains.length; i++) {
      avgGain = ((avgGain * (this.window - 1)) + gains[i]) / this.window;
      avgLoss = ((avgLoss * (this.window - 1)) + losses[i]) / this.window;

      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  calculateSignal(priceData, values, index) {
    if (index < 0 || index >= values.length) return 'hold';
    
    const rsi = values[index];
    const overbought = this.params.overbought;
    const oversold = this.params.oversold;
    
    // RSI below oversold level = buy signal
    if (rsi < oversold) {
      return 'buy';
    }
    
    // RSI above overbought level = sell signal
    if (rsi > overbought) {
      return 'sell';
    }
    
    return 'hold';
  }

  getSignalStrength(index) {
    if (index < 0 || index >= this.values.length) {
      return 0;
    }

    const rsi = this.values[index];
    const overbought = this.params.overbought;
    const oversold = this.params.oversold;
    
    // Stronger signal the further from neutral (50)
    if (rsi < oversold) {
      return Math.min(1.0, (oversold - rsi) / oversold);
    } else if (rsi > overbought) {
      return Math.min(1.0, (rsi - overbought) / (100 - overbought));
    }
    
    return 0.5;
  }
}

/**
 * MACD (Moving Average Convergence Divergence) Indicator
 */
class MACDIndicator extends TechnicalIndicator {
  constructor(fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    super('MACD', slowPeriod, { fastPeriod, slowPeriod, signalPeriod });
  }

  calculateValues(closes) {
    if (closes.length < this.params.slowPeriod) {
      return [];
    }

    const fastEMA = calculateEMA(closes, this.params.fastPeriod);
    const slowEMA = calculateEMA(closes, this.params.slowPeriod);
    
    // Calculate MACD line (fast EMA - slow EMA)
    const macdLine = [];
    const startIndex = this.params.slowPeriod - this.params.fastPeriod;
    
    for (let i = 0; i < fastEMA.length; i++) {
      const slowIndex = i + startIndex;
      if (slowIndex >= 0 && slowIndex < slowEMA.length) {
        macdLine.push(fastEMA[i] - slowEMA[slowIndex]);
      }
    }
    
    // Calculate signal line (EMA of MACD line)
    const signalLine = calculateEMA(macdLine, this.params.signalPeriod);
    
    // Calculate histogram (MACD line - signal line)
    const histogram = [];
    const signalStartIndex = this.params.signalPeriod - 1;
    
    for (let i = 0; i < macdLine.length; i++) {
      const signalIndex = i - signalStartIndex;
      if (signalIndex >= 0 && signalIndex < signalLine.length) {
        histogram.push(macdLine[i] - signalLine[signalIndex]);
      }
    }
    
    return {
      macdLine,
      signalLine,
      histogram
    };
  }

  calculateSignal(priceData, values, index) {
    if (!values.macdLine || !values.signalLine || index < 1) return 'hold';
    
    const currentMACD = values.macdLine[index];
    const currentSignal = values.signalLine[index];
    const previousMACD = values.macdLine[index - 1];
    const previousSignal = values.signalLine[index - 1];
    
    // MACD crossing above signal line = buy signal
    if (previousMACD <= previousSignal && currentMACD > currentSignal) {
      return 'buy';
    }
    
    // MACD crossing below signal line = sell signal
    if (previousMACD >= previousSignal && currentMACD < currentSignal) {
      return 'sell';
    }
    
    return 'hold';
  }

  getSignalStrength(index) {
    if (!this.values.histogram || index < 0 || index >= this.values.histogram.length) {
      return 0;
    }

    const histogram = this.values.histogram[index];
    // Stronger signal based on histogram magnitude
    return Math.min(1.0, Math.abs(histogram) / 10); // Normalize to 0-1
  }
}

/**
 * Bollinger Bands Indicator
 */
class BollingerBandsIndicator extends TechnicalIndicator {
  constructor(window = 20, multiplier = 2) {
    super('BollingerBands', window, { multiplier });
  }

  calculateValues(closes) {
    const sma = calculateSMA(closes, this.window);
    const bands = {
      upper: [],
      middle: sma,
      lower: []
    };
    
    for (let i = this.window - 1; i < closes.length; i++) {
      const windowCloses = closes.slice(i - this.window + 1, i + 1);
      const stdDev = calculateStdDev(windowCloses);
      const middle = sma[i - this.window + 1];
      
      bands.upper.push(middle + (this.params.multiplier * stdDev));
      bands.lower.push(middle - (this.params.multiplier * stdDev));
    }
    
    return bands;
  }

  calculateSignal(priceData, values, index) {
    if (index < 0 || index >= values.upper.length) return 'hold';
    
    const currentPrice = priceData[index + this.window - 1].close;
    const upperBand = values.upper[index];
    const lowerBand = values.lower[index];
    const middleBand = values.middle[index];
    
    // Price touching or crossing lower band = buy signal
    if (currentPrice <= lowerBand) {
      return 'buy';
    }
    
    // Price touching or crossing upper band = sell signal
    if (currentPrice >= upperBand) {
      return 'sell';
    }
    
    return 'hold';
  }

  getSignalStrength(index) {
    if (index < 0 || index >= this.values.upper.length) {
      return 0;
    }

    const currentPrice = priceData[index + this.window - 1].close;
    const upperBand = this.values.upper[index];
    const lowerBand = this.values.lower[index];
    const middleBand = this.values.middle[index];
    
    // Calculate how far price is from the middle band
    const bandWidth = upperBand - lowerBand;
    const distanceFromMiddle = Math.abs(currentPrice - middleBand);
    
    // Stronger signal the closer to the bands
    return Math.min(1.0, distanceFromMiddle / (bandWidth / 2));
  }
}

/**
 * Indicator Service Factory
 */
class IndicatorService {
  static createIndicator(type, params = {}) {
    switch (type.toUpperCase()) {
      case 'SMA':
        return new SMAIndicator(params.window || 20);
      
      case 'EMA':
        return new EMAIndicator(params.window || 12, params.alpha);
      
      case 'RSI':
        return new RSIIndicator(
          params.window || 14,
          params.overbought || 70,
          params.oversold || 30
        );
      
      case 'MACD':
        return new MACDIndicator(
          params.fastPeriod || 12,
          params.slowPeriod || 26,
          params.signalPeriod || 9
        );
      
      case 'BOLLINGER':
      case 'BOLLINGER_BANDS':
        return new BollingerBandsIndicator(
          params.window || 20,
          params.multiplier || 2
        );
      
      default:
        throw new Error(`Unknown indicator type: ${type}`);
    }
  }

  static getAvailableIndicators() {
    return [
      { type: 'SMA', name: 'Simple Moving Average', defaultWindow: 20 },
      { type: 'EMA', name: 'Exponential Moving Average', defaultWindow: 12 },
      { type: 'RSI', name: 'Relative Strength Index', defaultWindow: 14 },
      { type: 'MACD', name: 'MACD', defaultWindow: 26 },
      { type: 'BOLLINGER', name: 'Bollinger Bands', defaultWindow: 20 }
    ];
  }

  static calculateAllIndicators(priceData, indicatorTypes = ['SMA', 'RSI', 'MACD']) {
    const results = {};
    
    for (const type of indicatorTypes) {
      try {
        const indicator = this.createIndicator(type);
        const values = indicator.compute(priceData);
        results[type] = {
          values,
          signals: indicator.getAllSignals(),
          metadata: indicator.getMetadata()
        };
      } catch (error) {
        console.warn(`Failed to calculate ${type} indicator:`, error.message);
        results[type] = {
          error: error.message
        };
      }
    }
    
    return results;
  }
}

module.exports = {
  IndicatorService,
  SMAIndicator,
  EMAIndicator,
  RSIIndicator,
  MACDIndicator,
  BollingerBandsIndicator
};
