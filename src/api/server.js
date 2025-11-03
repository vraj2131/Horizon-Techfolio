// Load environment variables from .env file
require('dotenv').config();

const http = require('http');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');
const routes = require('./routes');
const { connectDB, isDBConnected, getDBStatus } = require('../db/connection');
const dailyUpdateService = require('../services/DailyUpdateService');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '../../public');

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

async function serveStaticFile(req, res, filePath) {
  try {
    const fullPath = path.join(PUBLIC_DIR, filePath);
    
    // Security: prevent directory traversal
    if (!fullPath.startsWith(PUBLIC_DIR)) {
      sendJson(res, 403, { error: 'Forbidden' });
      return;
    }

    const data = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    
    const contentTypeMap = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': data.length
    });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(res, 404, { error: 'File not found' });
    } else {
      console.error('Error serving static file:', error);
      sendJson(res, 500, { error: 'Internal server error' });
    }
  }
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let rawData = '';

    req.on('data', chunk => {
      rawData += chunk;
      // Guard against overly large bodies to avoid accidental memory issues
      if (rawData.length > 1e6) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });

    req.on('end', () => {
      if (!rawData) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawData));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;
  const method = req.method.toUpperCase();

  // Serve static files for frontend (check before API endpoints)
  if (method === 'GET') {
    // Serve HTML for root path
    if (pathname === '/' || pathname === '/index.html') {
      await serveStaticFile(req, res, 'index.html');
      return;
    }

    // Serve CSS, JS, and other static files
    if (pathname.endsWith('.css') || pathname.endsWith('.js') || pathname.endsWith('.html')) {
      const filePath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
      await serveStaticFile(req, res, filePath);
      return;
    }
  }

  // Health check endpoint
  if (method === 'GET' && pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'HorizonTrader',
      database: {
        connected: isDBConnected(),
        status: getDBStatus()
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // API info endpoint (moved to /api for clarity)
  if (method === 'GET' && pathname === '/api') {
    sendJson(res, 200, {
      service: 'HorizonTrader API',
      version: '1.0.0',
      endpoints: [
        'POST /user - Create user (REQUIRED before creating portfolio)',
        'POST /portfolio/initialize - Create portfolio (REQUIRES valid userId)',
        'GET /portfolio/:id/signals',
        'GET /portfolio/:id/strategy',
        'GET /portfolio/:id/performance',
        'POST /backtest',
        'GET /portfolio/:id/paper-trading',
        'POST /coupled-trade',
        'GET /user/:userId - Get user info',
        'GET /user/:userId/portfolios - Get user portfolios',
        'POST /stocks/search - Validate/search stock symbols',
        'GET /stocks/popular - Get list of popular available stocks'
      ]
    });
    return;
  }

  try {
    if (method === 'POST' && pathname === '/portfolio/initialize') {
      const body = await parseRequestBody(req);
      const result = await routes.initializePortfolio(body);
      sendJson(res, 201, result);
      return;
    }

    if (method === 'GET' && pathname.startsWith('/portfolio/') && pathname.endsWith('/signals')) {
      const portfolioId = pathname.split('/')[2];
      const result = await routes.getPortfolioSignals(portfolioId);
      sendJson(res, 200, result);
      return;
    }

    if (method === 'GET' && pathname.startsWith('/portfolio/') && pathname.endsWith('/strategy')) {
      const portfolioId = pathname.split('/')[2];
      const result = await routes.getPortfolioStrategy(portfolioId);
      sendJson(res, 200, result);
      return;
    }

    if (method === 'GET' && pathname.startsWith('/portfolio/') && pathname.endsWith('/performance')) {
      const portfolioId = pathname.split('/')[2];
      const result = await routes.getPortfolioPerformance(portfolioId);
      sendJson(res, 200, result);
      return;
    }

    if (method === 'GET' && pathname.startsWith('/portfolio/') && pathname.endsWith('/paper-trading')) {
      const portfolioId = pathname.split('/')[2];
      const result = await routes.getPaperTradingStatus(portfolioId);
      sendJson(res, 200, result);
      return;
    }

    if (method === 'POST' && pathname === '/backtest') {
      const body = await parseRequestBody(req);
      const result = await routes.runBacktest(body);
      sendJson(res, 200, result);
      return;
    }

    if (method === 'POST' && pathname === '/coupled-trade') {
      const body = await parseRequestBody(req);
      const result = await routes.generateCoupledTrade(body);
      sendJson(res, 200, result);
      return;
    }

    // User management endpoints
    if (method === 'POST' && pathname === '/user') {
      const body = await parseRequestBody(req);
      const result = await routes.createUser(body);
      sendJson(res, 201, result);
      return;
    }

    if (method === 'GET' && pathname.startsWith('/user/')) {
      const pathParts = pathname.split('/').filter(p => p);
      if (pathParts.length === 2 && pathParts[0] === 'user') {
        // GET /user/:userId
        const userId = pathParts[1];
        const result = await routes.getUser(userId);
        sendJson(res, 200, result);
        return;
      } else if (pathParts.length === 3 && pathParts[0] === 'user' && pathParts[2] === 'portfolios') {
        // GET /user/:userId/portfolios
        const userId = pathParts[1];
        const result = await routes.getUserPortfolios(userId);
        sendJson(res, 200, result);
        return;
      }
    }

    // Stock search/discovery endpoints
    if (method === 'POST' && pathname === '/stocks/search') {
      const body = await parseRequestBody(req);
      const result = await routes.searchStocks(body);
      sendJson(res, 200, result);
      return;
    }

    if (method === 'GET' && pathname === '/stocks/popular') {
      const result = await routes.getPopularStocks();
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 404, {
      error: 'Not Found',
      message: `No handler for ${method} ${pathname}`
    });
  } catch (error) {
    console.error(`Request handling error for ${method} ${pathname}:`, error.message);
    sendJson(res, 400, {
      error: error.message || 'Unknown error'
    });
  }
}

const server = http.createServer((req, res) => {
  // Enable basic CORS support for local development/frontends
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  handleRequest(req, res);
});

// Initialize database connection and start server
async function startServer() {
  try {
    // Try to connect to database (non-blocking - app works with or without DB)
    await connectDB();
    
    // Start daily update service if database is connected
    if (isDBConnected()) {
      dailyUpdateService.start();
    }
  } catch (error) {
    console.log('⚠️  Continuing without database (in-memory storage will be used)');
  }

  server.listen(PORT, () => {
    console.log(`HorizonTrader server running on http://localhost:${PORT}`);
    console.log(`Database: ${isDBConnected() ? '✅ Connected' : '⚠️  Using in-memory storage'}`);
    console.log(`Price Data Service: ${isDBConnected() ? '✅ Active (daily updates enabled)' : '⚠️  Using file cache only'}`);
    console.log('Available endpoints:');
    console.log('  POST /user - Create user (REQUIRED first)');
    console.log('  POST /portfolio/initialize - Create portfolio (REQUIRES valid userId)');
    console.log('  GET  /portfolio/:id/signals - Current buy/hold/sell signals');
    console.log('  GET  /portfolio/:id/strategy - Recommended strategy + frequency');
    console.log('  POST /backtest - Run historical backtest, return metrics');
    console.log('  GET  /portfolio/:id/paper-trading - Current paper trading status');
    console.log('  POST /coupled-trade - Generate hedged trade recommendation');
    console.log('  GET  /portfolio/:id/performance - Current performance metrics');
    console.log('  GET  /user/:userId - Get user information');
    console.log('  GET  /user/:userId/portfolios - Get all portfolios for user');
    console.log('  POST /stocks/search - Validate/search stock symbols');
    console.log('  GET  /stocks/popular - Get list of popular available stocks');
    console.log('  GET  /health - Health check');
    console.log('  GET  / - API information');
  });
}

startServer();

process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  dailyUpdateService.stop();
  server.close(async () => {
    const { disconnectDB } = require('../db/connection');
    await disconnectDB();
    process.exit(0);
  });
});

module.exports = server;




