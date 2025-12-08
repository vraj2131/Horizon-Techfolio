/**
 * BacktestEngine - Core backtesting simulation engine
 * Simulates trading strategies on historical stock data
 * Uses only database data, no external API calls
 */

const { IndicatorService } = require('./IndicatorService');
const StrategyService = require('./StrategyService');

class BacktestEngine {
  /**
   * Initialize backtest engine
   * @param {Object} config - Backtest configuration
   * @param {string} config.ticker - Stock ticker symbol
   * @param {Array} config.priceData - Historical price data (OHLCV)
   * @param {string} config.strategyKey - Strategy key (trend_following, mean_reversion, momentum)
   * @param {number} config.initialCapital - Starting capital
   * @param {number} config.positionSizePercent - Percentage of cash to use per trade (default 50)
   */
  constructor(config) {
    this.ticker = config.ticker;
    this.priceData = config.priceData;
    this.strategyKey = config.strategyKey;
    this.initialCapital = config.initialCapital;
    this.positionSizePercent = config.positionSizePercent || 50;

    // Get strategy from StrategyService
    this.strategyService = new StrategyService();
    this.strategy = this.strategyService.getStrategy(this.strategyKey);
    
    if (!this.strategy) {
      throw new Error(`Strategy not found: ${this.strategyKey}`);
    }

    // State tracking
    this.cash = this.initialCapital;
    this.shares = 0;
    this.trades = [];
    this.dailyPortfolioValues = [];
    this.currentPosition = null; // { buyPrice, buyDate, quantity }
    
    // Required data days for indicators
    this.requiredDataDays = this.calculateRequiredDataDays();
  }

  /**
   * Calculate minimum days of data needed before simulation can start
   * Based on the strategy's indicator requirements
   * @returns {number} Minimum days required
   */
  calculateRequiredDataDays() {
    let maxWindow = 0;
    
    for (const indicatorConfig of this.strategy.indicators) {
      const { type, params } = indicatorConfig;
      let window = 0;
      
      switch (type.toUpperCase()) {
        case 'SMA':
        case 'EMA':
        case 'RSI':
        case 'BOLLINGER':
          window = params.window || 20;
          break;
        case 'MACD':
          // MACD needs slowPeriod + signalPeriod - 1 days
          window = (params.slowPeriod || 26) + (params.signalPeriod || 9) - 1;
          break;
        default:
          window = 20; // Default fallback
      }
      
      maxWindow = Math.max(maxWindow, window);
    }
    
    // Add buffer for signal calculation (need previous day comparison)
    return maxWindow + 5;
  }

  /**
   * Run the backtest simulation
   * @returns {Object} Backtest results with metrics and trades
   */
  async run() {
    console.log(`\n========== BACKTEST START ==========`);
    console.log(`Ticker: ${this.ticker}`);
    console.log(`Strategy: ${this.strategy.name}`);
    console.log(`Initial Capital: $${this.initialCapital.toLocaleString()}`);
    console.log(`Position Size: ${this.positionSizePercent}%`);
    console.log(`Price Data Points: ${this.priceData.length}`);
    console.log(`Required Data Days: ${this.requiredDataDays}`);
    
    // Validate we have enough data
    if (this.priceData.length < this.requiredDataDays) {
      throw new Error(`Insufficient data: need at least ${this.requiredDataDays} data points, have ${this.priceData.length}`);
    }

    // Sort price data by date (ascending)
    this.priceData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get date range
    const startDate = this.priceData[0].date;
    const endDate = this.priceData[this.priceData.length - 1].date;
    console.log(`Date Range: ${startDate} to ${endDate}`);
    
    // Find the first day we can start simulation (after warm-up period)
    const simulationStartIndex = this.requiredDataDays;
    console.log(`Simulation starts at index: ${simulationStartIndex} (date: ${this.priceData[simulationStartIndex]?.date})`);
    console.log(`=====================================\n`);

    // Run day-by-day simulation
    for (let dayIndex = simulationStartIndex; dayIndex < this.priceData.length; dayIndex++) {
      this.simulateDay(dayIndex);
    }

    // Close any open position at the end
    if (this.shares > 0) {
      const lastPrice = this.priceData[this.priceData.length - 1].close;
      const lastDate = this.priceData[this.priceData.length - 1].date;
      this.executeSell(lastDate, lastPrice, 'End of backtest - closing position');
    }

    // Calculate final metrics
    const metrics = this.calculateMetrics();

    console.log(`\n========== BACKTEST COMPLETE ==========`);
    console.log(`Final Portfolio Value: $${metrics.finalValue.toLocaleString()}`);
    console.log(`Total Return: ${(metrics.totalReturn * 100).toFixed(2)}%`);
    console.log(`Total Trades: ${metrics.totalTrades}`);
    console.log(`Win Rate: ${(metrics.winRate * 100).toFixed(1)}%`);
    console.log(`========================================\n`);

    return {
      ticker: this.ticker,
      strategy: this.strategy.name,
      startDate: this.priceData[simulationStartIndex].date,
      endDate: this.priceData[this.priceData.length - 1].date,
      metrics,
      trades: this.trades
    };
  }

  /**
   * Simulate a single day of trading
   * @param {number} dayIndex - Index in priceData array
   */
  simulateDay(dayIndex) {
    try {
      const currentDay = this.priceData[dayIndex];
      if (!currentDay) {
        console.warn(`Warning: No data for day index ${dayIndex}`);
        return;
      }

      const currentPrice = currentDay.close;
      const currentDate = currentDay.date;

      // Get historical data up to this day (for indicator calculation)
      const historicalData = this.priceData.slice(0, dayIndex + 1);

      // Calculate indicators and get signal
      const signal = this.getStrategySignal(historicalData);

      // Execute trade based on signal
      if (signal === 'buy' && this.shares === 0) {
        // Only buy if we don't have a position
        this.executeBuy(currentDate, currentPrice);
      } else if (signal === 'sell' && this.shares > 0) {
        // Only sell if we have a position
        this.executeSell(currentDate, currentPrice, 'Strategy signal');
      }

      // Track daily portfolio value
      const portfolioValue = this.cash + (this.shares * currentPrice);
      this.dailyPortfolioValues.push({
        date: currentDate,
        value: portfolioValue,
        cash: this.cash,
        shares: this.shares,
        price: currentPrice
      });
    } catch (error) {
      console.error(`Error simulating day ${dayIndex}:`, error.message);
      // Continue simulation even if one day fails
    }
  }

  /**
   * Get trading signal from strategy
   * @param {Array} priceData - Historical price data up to current day
   * @returns {string} Signal: 'buy', 'sell', or 'hold'
   */
  getStrategySignal(priceData) {
    try {
      if (!priceData || priceData.length === 0) {
        return 'hold';
      }

      const indicatorSignals = {};

      // Calculate each indicator for the strategy
      for (const indicatorConfig of this.strategy.indicators) {
        try {
          const indicator = IndicatorService.createIndicator(
            indicatorConfig.type,
            indicatorConfig.params
          );
          
          const values = indicator.compute(priceData);
          const signals = indicator.getAllSignals();
          
          if (signals && signals.length > 0) {
            indicatorSignals[indicatorConfig.type] = signals;
          } else {
            indicatorSignals[indicatorConfig.type] = ['hold'];
          }
        } catch (error) {
          // If indicator calculation fails, default to hold
          console.warn(`Indicator ${indicatorConfig.type} calculation failed:`, error.message);
          indicatorSignals[indicatorConfig.type] = ['hold'];
        }
      }

      // Apply strategy rules to get final signal
      const finalSignal = this.applyMajorityVote(indicatorSignals);
      return finalSignal;
    } catch (error) {
      console.warn(`Error getting strategy signal: ${error.message}`);
      return 'hold';
    }
  }

  /**
   * Apply majority vote to determine final signal
   * @param {Object} indicatorSignals - Signals from all indicators
   * @returns {string} Final signal
   */
  applyMajorityVote(indicatorSignals) {
    const signalCounts = { buy: 0, hold: 0, sell: 0 };
    
    for (const [indicatorType, signals] of Object.entries(indicatorSignals)) {
      if (signals.length > 0) {
        const latestSignal = signals[signals.length - 1];
        if (signalCounts[latestSignal] !== undefined) {
          signalCounts[latestSignal]++;
        }
      }
    }

    // Return the signal with highest count
    const maxCount = Math.max(signalCounts.buy, signalCounts.sell, signalCounts.hold);
    
    if (signalCounts.buy === maxCount && signalCounts.buy > 0) {
      return 'buy';
    } else if (signalCounts.sell === maxCount && signalCounts.sell > 0) {
      return 'sell';
    }
    
    return 'hold';
  }

  /**
   * Execute a buy trade
   * @param {string} date - Trade date
   * @param {number} price - Current price
   */
  executeBuy(date, price) {
    // Calculate position size based on percentage of available cash
    const positionValue = this.cash * (this.positionSizePercent / 100);
    const sharesToBuy = Math.floor(positionValue / price);
    
    if (sharesToBuy <= 0) {
      return; // Not enough cash to buy
    }

    const tradeValue = sharesToBuy * price;
    
    // Update state
    this.cash -= tradeValue;
    this.shares += sharesToBuy;
    this.currentPosition = {
      buyPrice: price,
      buyDate: date,
      quantity: sharesToBuy
    };

    // Record trade
    const trade = {
      date,
      type: 'BUY',
      price,
      quantity: sharesToBuy,
      value: tradeValue
    };
    this.trades.push(trade);

    console.log(`📈 BUY: ${date} - ${sharesToBuy} shares @ $${price.toFixed(2)} = $${tradeValue.toFixed(2)}`);
  }

  /**
   * Execute a sell trade
   * @param {string} date - Trade date
   * @param {number} price - Current price
   * @param {string} reason - Reason for selling
   */
  executeSell(date, price, reason = '') {
    if (this.shares <= 0) {
      return; // No shares to sell
    }

    const tradeValue = this.shares * price;
    const sharesToSell = this.shares;
    
    // Calculate profit/loss for this trade
    let profitLoss = 0;
    if (this.currentPosition) {
      profitLoss = (price - this.currentPosition.buyPrice) * sharesToSell;
    }

    // Update state
    this.cash += tradeValue;
    this.shares = 0;
    this.currentPosition = null;

    // Record trade
    const trade = {
      date,
      type: 'SELL',
      price,
      quantity: sharesToSell,
      value: tradeValue,
      profitLoss,
      reason
    };
    this.trades.push(trade);

    const profitLossStr = profitLoss >= 0 ? `+$${profitLoss.toFixed(2)}` : `-$${Math.abs(profitLoss).toFixed(2)}`;
    console.log(`📉 SELL: ${date} - ${sharesToSell} shares @ $${price.toFixed(2)} = $${tradeValue.toFixed(2)} (${profitLossStr})`);
  }

  /**
   * Calculate performance metrics
   * @returns {Object} Performance metrics
   */
  calculateMetrics() {
    const finalValue = this.cash + (this.shares * (this.priceData[this.priceData.length - 1]?.close || 0));
    const totalReturn = (finalValue - this.initialCapital) / this.initialCapital;
    
    // Calculate years for CAGR
    const startDate = new Date(this.priceData[this.requiredDataDays]?.date);
    const endDate = new Date(this.priceData[this.priceData.length - 1]?.date);
    const years = (endDate - startDate) / (365.25 * 24 * 60 * 60 * 1000);
    
    // CAGR: (finalValue / initialCapital)^(1/years) - 1
    const cagr = years > 0 ? Math.pow(finalValue / this.initialCapital, 1 / years) - 1 : 0;
    
    // Calculate max drawdown
    const maxDrawdown = this.calculateMaxDrawdown();
    
    // Calculate trade statistics
    const sellTrades = this.trades.filter(t => t.type === 'SELL' && t.profitLoss !== undefined);
    const totalTrades = sellTrades.length;
    const profitableTrades = sellTrades.filter(t => t.profitLoss > 0).length;
    const winRate = totalTrades > 0 ? profitableTrades / totalTrades : 0;
    
    // Calculate average return per trade
    const totalProfitLoss = sellTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const averageReturn = totalTrades > 0 ? totalProfitLoss / totalTrades / this.initialCapital : 0;
    
    // Calculate Sharpe Ratio (simplified - using daily returns)
    const sharpeRatio = this.calculateSharpeRatio();

    return {
      totalReturn,
      cagr,
      sharpeRatio,
      maxDrawdown,
      winRate,
      totalTrades,
      profitableTrades,
      averageReturn,
      finalValue,
      initialCapital: this.initialCapital
    };
  }

  /**
   * Calculate maximum drawdown
   * @returns {number} Maximum drawdown as a negative percentage
   */
  calculateMaxDrawdown() {
    if (this.dailyPortfolioValues.length === 0) {
      return 0;
    }

    let peak = this.dailyPortfolioValues[0].value;
    let maxDrawdown = 0;

    for (const daily of this.dailyPortfolioValues) {
      if (daily.value > peak) {
        peak = daily.value;
      }
      
      const drawdown = (daily.value - peak) / peak;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Calculate Sharpe Ratio
   * Using daily portfolio returns with risk-free rate of 0
   * @returns {number} Sharpe Ratio
   */
  calculateSharpeRatio() {
    if (this.dailyPortfolioValues.length < 2) {
      return 0;
    }

    // Calculate daily returns
    const dailyReturns = [];
    for (let i = 1; i < this.dailyPortfolioValues.length; i++) {
      const previousValue = this.dailyPortfolioValues[i - 1].value;
      const currentValue = this.dailyPortfolioValues[i].value;
      const dailyReturn = (currentValue - previousValue) / previousValue;
      dailyReturns.push(dailyReturn);
    }

    // Calculate average daily return
    const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

    // Calculate standard deviation of daily returns
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);

    // Annualized Sharpe Ratio (assuming 252 trading days)
    // Sharpe = (avgReturn - riskFreeRate) / stdDev * sqrt(252)
    // Using risk-free rate of 0
    if (stdDev === 0) {
      return 0;
    }

    const annualizedSharpe = (avgReturn / stdDev) * Math.sqrt(252);
    return annualizedSharpe;
  }
}

module.exports = BacktestEngine;

