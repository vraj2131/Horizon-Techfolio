#!/usr/bin/env node
/**
 * Fix Portfolio Values Script
 * Updates existing portfolios to have correct cash and initialCapital values
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PortfolioModel = require('../src/db/models/PortfolioModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/horizontrader';

async function fixPortfolios() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all portfolios
    const portfolios = await PortfolioModel.find({});
    console.log(`\n📊 Found ${portfolios.length} portfolio(s)`);

    let updated = 0;
    for (const portfolio of portfolios) {
      let needsUpdate = false;
      const updates = {};

      // Fix cash if it's 0 or null
      if (!portfolio.cash || portfolio.cash === 0) {
        if (portfolio.initialCapital && portfolio.initialCapital > 0) {
          updates.cash = portfolio.initialCapital;
        } else {
          updates.cash = 100000; // Default
        }
        needsUpdate = true;
        console.log(`  Portfolio ${portfolio.portfolioId}: Setting cash to ${updates.cash}`);
      }

      // Set initialCapital if not set
      if (!portfolio.initialCapital || portfolio.initialCapital === 0) {
        updates.initialCapital = portfolio.cash || updates.cash || 100000;
        needsUpdate = true;
        console.log(`  Portfolio ${portfolio.portfolioId}: Setting initialCapital to ${updates.initialCapital}`);
      }

      if (needsUpdate) {
        await PortfolioModel.updateOne(
          { portfolioId: portfolio.portfolioId },
          { $set: updates }
        );
        updated++;
        console.log(`  ✅ Updated portfolio ${portfolio.portfolioId}`);
      }
    }

    console.log(`\n✅ Fixed ${updated} portfolio(s)`);
    console.log('✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixPortfolios();








/**
 * Fix Portfolio Values Script
 * Updates existing portfolios to have correct cash and initialCapital values
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PortfolioModel = require('../src/db/models/PortfolioModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/horizontrader';

async function fixPortfolios() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all portfolios
    const portfolios = await PortfolioModel.find({});
    console.log(`\n📊 Found ${portfolios.length} portfolio(s)`);

    let updated = 0;
    for (const portfolio of portfolios) {
      let needsUpdate = false;
      const updates = {};

      // Fix cash if it's 0 or null
      if (!portfolio.cash || portfolio.cash === 0) {
        if (portfolio.initialCapital && portfolio.initialCapital > 0) {
          updates.cash = portfolio.initialCapital;
        } else {
          updates.cash = 100000; // Default
        }
        needsUpdate = true;
        console.log(`  Portfolio ${portfolio.portfolioId}: Setting cash to ${updates.cash}`);
      }

      // Set initialCapital if not set
      if (!portfolio.initialCapital || portfolio.initialCapital === 0) {
        updates.initialCapital = portfolio.cash || updates.cash || 100000;
        needsUpdate = true;
        console.log(`  Portfolio ${portfolio.portfolioId}: Setting initialCapital to ${updates.initialCapital}`);
      }

      if (needsUpdate) {
        await PortfolioModel.updateOne(
          { portfolioId: portfolio.portfolioId },
          { $set: updates }
        );
        updated++;
        console.log(`  ✅ Updated portfolio ${portfolio.portfolioId}`);
      }
    }

    console.log(`\n✅ Fixed ${updated} portfolio(s)`);
    console.log('✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixPortfolios();







