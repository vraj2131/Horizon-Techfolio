/**
 * Mathematical calculation utilities for technical analysis
 */

/**
 * Calculate simple moving average
 * @param {Array<number>} values - Array of values
 * @param {number} window - Window size
 * @returns {Array<number>} SMA values
 */
function calculateSMA(values, window) {
  if (!Array.isArray(values) || values.length < window) {
    return [];
  }
  
  const sma = [];
  for (let i = window - 1; i < values.length; i++) {
    const sum = values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / window);
  }
  
  return sma;
}

/**
 * Calculate exponential moving average
 * @param {Array<number>} values - Array of values
 * @param {number} window - Window size
 * @param {number} alpha - Smoothing factor (optional)
 * @returns {Array<number>} EMA values
 */
function calculateEMA(values, window, alpha = null) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }
  
  const smoothingFactor = alpha || (2 / (window + 1));
  const ema = [values[0]]; // Start with first value
  
  for (let i = 1; i < values.length; i++) {
    const emaValue = (values[i] * smoothingFactor) + (ema[i - 1] * (1 - smoothingFactor));
    ema.push(emaValue);
  }
  
  return ema;
}

/**
 * Calculate standard deviation
 * @param {Array<number>} values - Array of values
 * @param {number} mean - Mean value (optional, will calculate if not provided)
 * @returns {number} Standard deviation
 */
function calculateStdDev(values, mean = null) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const avg = mean !== null ? mean : values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate mean of values
 * @param {Array<number>} values - Array of values
 * @returns {number} Mean value
 */
function calculateMean(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate correlation coefficient between two arrays
 * @param {Array<number>} x - First array
 * @param {Array<number>} y - Second array
 * @returns {number} Correlation coefficient (-1 to 1)
 */
function calculateCorrelation(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length === 0) {
    return 0;
  }
  
  const n = x.length;
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  
  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    
    numerator += diffX * diffY;
    sumXSquared += diffX * diffX;
    sumYSquared += diffY * diffY;
  }
  
  const denominator = Math.sqrt(sumXSquared * sumYSquared);
  
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate rolling correlation between two arrays
 * @param {Array<number>} x - First array
 * @param {Array<number>} y - Second array
 * @param {number} window - Window size
 * @returns {Array<number>} Rolling correlation values
 */
function calculateRollingCorrelation(x, y, window) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < window) {
    return [];
  }
  
  const correlations = [];
  
  for (let i = window - 1; i < x.length; i++) {
    const xWindow = x.slice(i - window + 1, i + 1);
    const yWindow = y.slice(i - window + 1, i + 1);
    const correlation = calculateCorrelation(xWindow, yWindow);
    correlations.push(correlation);
  }
  
  return correlations;
}

/**
 * Calculate percentage change
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    return 0;
  }
  
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate compound annual growth rate (CAGR)
 * @param {number} beginningValue - Starting value
 * @param {number} endingValue - Ending value
 * @param {number} years - Number of years
 * @returns {number} CAGR as decimal
 */
function calculateCAGR(beginningValue, endingValue, years) {
  if (beginningValue <= 0 || years <= 0) {
    return 0;
  }
  
  return Math.pow(endingValue / beginningValue, 1 / years) - 1;
}

/**
 * Calculate Sharpe ratio
 * @param {Array<number>} returns - Array of returns
 * @param {number} riskFreeRate - Risk-free rate (default 0.02 for 2%)
 * @returns {number} Sharpe ratio
 */
function calculateSharpeRatio(returns, riskFreeRate = 0.02) {
  if (!Array.isArray(returns) || returns.length === 0) {
    return 0;
  }
  
  const meanReturn = calculateMean(returns);
  const stdDev = calculateStdDev(returns);
  
  if (stdDev === 0) {
    return 0;
  }
  
  return (meanReturn - riskFreeRate) / stdDev;
}

/**
 * Calculate maximum drawdown
 * @param {Array<number>} values - Array of portfolio values
 * @returns {Object} Max drawdown info
 */
function calculateMaxDrawdown(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { maxDrawdown: 0, peakIndex: -1, troughIndex: -1 };
  }
  
  let maxDrawdown = 0;
  let peak = values[0];
  let peakIndex = 0;
  let troughIndex = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i];
      peakIndex = i;
    }
    
    const drawdown = (peak - values[i]) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      troughIndex = i;
    }
  }
  
  return {
    maxDrawdown,
    peakIndex,
    troughIndex,
    peakValue: values[peakIndex],
    troughValue: values[troughIndex]
  };
}

/**
 * Calculate z-score
 * @param {number} value - Value to calculate z-score for
 * @param {Array<number>} series - Series to calculate z-score against
 * @returns {number} Z-score
 */
function calculateZScore(value, series) {
  if (!Array.isArray(series) || series.length === 0) {
    return 0;
  }
  
  const mean = calculateMean(series);
  const stdDev = calculateStdDev(series);
  
  if (stdDev === 0) {
    return 0;
  }
  
  return (value - mean) / stdDev;
}

/**
 * Calculate rolling window statistics
 * @param {Array<number>} values - Array of values
 * @param {number} window - Window size
 * @returns {Object} Rolling statistics
 */
function calculateRollingStats(values, window) {
  if (!Array.isArray(values) || values.length < window) {
    return { sma: [], ema: [], stdDev: [] };
  }
  
  const sma = calculateSMA(values, window);
  const ema = calculateEMA(values, window);
  const stdDev = [];
  
  for (let i = window - 1; i < values.length; i++) {
    const windowValues = values.slice(i - window + 1, i + 1);
    stdDev.push(calculateStdDev(windowValues));
  }
  
  return { sma, ema, stdDev };
}

/**
 * Normalize values to 0-1 range
 * @param {Array<number>} values - Array of values
 * @returns {Array<number>} Normalized values
 */
function normalizeValues(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (max === min) {
    return values.map(() => 0.5);
  }
  
  return values.map(value => (value - min) / (max - min));
}

module.exports = {
  calculateSMA,
  calculateEMA,
  calculateStdDev,
  calculateMean,
  calculateCorrelation,
  calculateRollingCorrelation,
  calculatePercentageChange,
  calculateCAGR,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateZScore,
  calculateRollingStats,
  normalizeValues
};

















