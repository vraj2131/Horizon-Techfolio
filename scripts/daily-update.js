#!/usr/bin/env node
/**
 * Daily Update Script
 * Run this script manually or via cron to update price data
 * Usage: node scripts/daily-update.js [ticker1] [ticker2] ...
 */

// Try to load .env file (optional - environment variables can be set directly)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not required if env vars are set directly
}
const { connectDB, isDBConnected } = require('../src/db/connection');
const dailyUpdateService = require('../src/services/DailyUpdateService');

async function main() {
  console.log('🔄 Starting daily price data update...');
  
  try {
    // Connect to database
    await connectDB();
    
    if (!isDBConnected()) {
      console.error('❌ Database not connected. Cannot update price data.');
      process.exit(1);
    }
    
    // If tickers provided as arguments, update only those
    const args = process.argv.slice(2);
    if (args.length > 0) {
      console.log(`📊 Updating specific tickers: ${args.join(', ')}`);
      await dailyUpdateService.updateTickers(args);
    } else {
      // Otherwise, update all tickers that need updating
      console.log('📊 Updating all tickers that need updates...');
      await dailyUpdateService.runUpdate();
    }
    
    console.log('✅ Daily update complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during daily update:', error.message);
    process.exit(1);
  }
}

main();

