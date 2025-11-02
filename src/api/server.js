const http = require('http');
const { URL } = require('url');
const routes = require('./routes');

const PORT = process.env.PORT || 3000;

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
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

  // Health check and root info endpoints
  if (method === 'GET' && pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'HorizonTrader',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (method === 'GET' && pathname === '/') {
    sendJson(res, 200, {
      service: 'HorizonTrader API',
      version: '1.0.0',
      endpoints: [
        'POST /portfolio/initialize',
        'GET /portfolio/:id/signals',
        'GET /portfolio/:id/strategy',
        'GET /portfolio/:id/performance',
        'POST /backtest',
        'GET /portfolio/:id/paper-trading',
        'POST /coupled-trade'
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

server.listen(PORT, () => {
  console.log(`HorizonTrader server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /portfolio/initialize - Create portfolio with tickers + horizon');
  console.log('  GET  /portfolio/:id/signals - Current buy/hold/sell signals');
  console.log('  GET  /portfolio/:id/strategy - Recommended strategy + frequency');
  console.log('  POST /backtest - Run historical backtest, return metrics');
  console.log('  GET  /portfolio/:id/paper-trading - Current paper trading status');
  console.log('  POST /coupled-trade - Generate hedged trade recommendation');
  console.log('  GET  /portfolio/:id/performance - Current performance metrics');
  console.log('  GET  /health - Health check');
  console.log('  GET  / - API information');
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = server;



