/**
 * DailyUpdateService - Background service to update price data daily
 * Runs at end of trading day to fetch latest data for all tracked tickers
 */

const PriceDataService = require('./PriceDataService');
const PriceDataModel = require('../db/models/PriceDataModel');
const { isDBConnected } = require('../db/connection');

class DailyUpdateService {
  constructor() {
    this.priceDataService = new PriceDataService();
    this.updateInterval = null;
    this.isRunning = false;
  }

  /**
   * Start daily update service
   * Checks for updates every hour, updates data if needed
   */
  start() {
    if (this.isRunning) {
      console.log('Daily update service already running');
      return;
    }

    if (!isDBConnected()) {
      console.log('⚠️ Database not connected - daily update service not started');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting daily price data update service...');
    
    // Run immediately
    this.runUpdate();
    
    // Then run every hour to check for updates
    this.updateInterval = setInterval(() => {
      this.runUpdate();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop daily update service
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('Daily update service stopped');
  }

  /**
   * Run update for all tickers that need updating
   */
  async runUpdate() {
    try {
      console.log('🔍 Checking for tickers needing update...');
      
      const tickers = await this.priceDataService.getTickersNeedingUpdate();
      
      if (tickers.length === 0) {
        console.log('✅ All tickers are up to date');
        return;
      }

      console.log(`📊 Updating ${tickers.length} ticker(s): ${tickers.join(', ')}`);
      await this.priceDataService.batchUpdateTickers(tickers);
      
    } catch (error) {
      console.error('Error in daily update:', error.message);
    }
  }

  /**
   * Manually trigger update for specific tickers
   */
  async updateTickers(tickers) {
    console.log(`🔄 Manually updating ${tickers.length} ticker(s)...`);
    await this.priceDataService.batchUpdateTickers(tickers);
  }

  /**
   * Initialize data for new tickers (called when portfolio is created)
   */
  async initializeTickers(tickers) {
    console.log(`📥 Initializing data for ${tickers.length} new ticker(s)...`);
    
    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      try {
        await this.priceDataService.initializeTickerData(ticker);
        
        // Rate limiting: wait between calls
        if (i < tickers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds
        }
      } catch (error) {
        console.error(`Failed to initialize ${ticker}:`, error.message);
      }
    }
    
    console.log(`✅ Initialization complete for ${tickers.length} ticker(s)`);
  }
}

// Singleton instance
const dailyUpdateService = new DailyUpdateService();

module.exports = dailyUpdateService;

