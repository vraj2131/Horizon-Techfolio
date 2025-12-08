/**
 * Server Entry Point
 * Express server with database connection and route mounting
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const app = require('../app');
const { connectDB, isDBConnected, getDBStatus } = require('../db/connection');
const dailyUpdateService = require('../services/DailyUpdateService');
const config = require('../../config/config');

const PORT = config.app.port;
const HOST = config.app.host;

/**
 * Initialize server
 */
async function startServer() {
  try {
    console.log('🚀 Starting HorizonTrader Server...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // ==================== Check Gemini Service ====================
    try {
      const GeminiService = require('../services/GeminiService');
      const geminiService = new GeminiService();
      if (geminiService.isEnabled()) {
        console.log('✅ Gemini AI service is enabled and ready');
      } else {
        console.log('⚠️  Gemini AI service is disabled');
      }
    } catch (error) {
      console.log('⚠️  Could not initialize Gemini service:', error.message);
    }
    
    // ==================== Database Connection ====================
    console.log('\n📊 Connecting to database...');
    await connectDB();
    
    if (isDBConnected()) {
      console.log('✅ Database connected successfully');
      const dbStatus = getDBStatus();
      console.log(`   Database: ${dbStatus.name}`);
      console.log(`   Status: ${dbStatus.status}`);
    } else {
      console.warn('⚠️  Database connection failed - running in memory mode');
      console.warn('⚠️  Some features may not work without database connection');
      console.warn('⚠️  To fix: Check MongoDB Atlas IP whitelist or connection string');
    }

    // ==================== Daily Update Service ====================
    // Only start in production or if explicitly enabled
    if (process.env.ENABLE_DAILY_UPDATES === 'true') {
      console.log('\n⏰ Starting daily update service...');
      dailyUpdateService.start();
      console.log('✅ Daily update service started');
    } else {
      console.log('\n⏰ Daily update service disabled (set ENABLE_DAILY_UPDATES=true to enable)');
    }

    // ==================== Mount API Routes First ====================
    const apiRoutes = require('./routes/index');
    app.use('/', apiRoutes);
    
    console.log('✅ API routes mounted');

    // ==================== Static File Serving (After API Routes) ====================
    // Serve frontend files from public directory
    // This comes AFTER API routes so API endpoints take precedence
    const PUBLIC_DIR = path.join(__dirname, '../../public');
    app.use(express.static(PUBLIC_DIR));
    
    console.log(`📁 Serving static files from: ${PUBLIC_DIR}`);

    // ==================== Error Handling ====================
    // Import and use error handling middleware
    const { notFound, errorHandler } = require('./middleware/error.middleware');
    
    // 404 handler - must be after all routes
    app.use(notFound);
    
    // Global error handler - must be last
    app.use(errorHandler);

    // ==================== Start Server ====================
    const server = app.listen(PORT, HOST, () => {
      console.log('\n✅ Server started successfully!');
      console.log(`\n🌐 Server running at:`);
      console.log(`   Local:            http://${HOST}:${PORT}/`);
      console.log(`   API Information:  http://${HOST}:${PORT}/api`);
      console.log(`   Health Check:     http://${HOST}:${PORT}/health`);
      console.log(`\n📚 API Endpoints:`);
      console.log(`   Portfolio:        POST   /portfolio/initialize`);
      console.log(`                     POST   /portfolio/custom`);
      console.log(`                     POST   /portfolio/curated`);
      console.log(`                     GET    /portfolio/curated/options`);
      console.log(`                     GET    /portfolio/:id/signals`);
      console.log(`                     GET    /portfolio/:id/strategy`);
      console.log(`                     GET    /portfolio/:id/performance`);
      console.log(`   User & Auth:      POST   /user`);
      console.log(`                     POST   /auth/login`);
      console.log(`                     POST   /auth/verify`);
      console.log(`                     GET    /user/:userId/portfolios`);
      console.log(`   Stocks:           POST   /stocks/search`);
      console.log(`                     GET    /stocks/popular`);
      console.log(`                     GET    /stocks/available`);
      console.log(`   Backtesting:      POST   /backtest`);
      console.log(`   Paper Trading:    GET    /paper-trading/:id`);
      console.log(`   Coupled Trades:   POST   /coupled-trade`);
      console.log(`\n⚡ Press Ctrl+C to stop the server`);
    });

    // ==================== Graceful Shutdown ====================
    const gracefulShutdown = async (signal) => {
      console.log(`\n\n${signal} received. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        // Stop daily update service
        if (dailyUpdateService.isRunning) {
          console.log('⏰ Stopping daily update service...');
          dailyUpdateService.stop();
          console.log('✅ Daily update service stopped');
        }
        
        // Close database connection
        if (isDBConnected()) {
          console.log('📊 Closing database connection...');
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          console.log('✅ Database connection closed');
        }
        
        console.log('👋 Shutdown complete. Goodbye!');
        process.exit(0);
      });

      // Force shutdown after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection:', reason);
      if (reason instanceof Error) {
        console.error('   Stack:', reason.stack);
      }
      // Don't shutdown on unhandled rejections during development
      // Just log the error to prevent infinite restart loops
      if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
      } else {
        console.warn('⚠️  Continuing in development mode. Fix the unhandled rejection above.');
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Export app for testing
module.exports = app;
