# Testing Guide for HorizonTrader

This guide covers all ways to test the HorizonTrader application.

## 📋 Table of Contents
1. [Unit Tests](#unit-tests)
2. [Testing the API Server](#testing-the-api-server)
3. [Manual API Testing](#manual-api-testing)
4. [Integration Testing](#integration-testing)

---

## 1. Unit Tests

Unit tests verify that individual components work correctly in isolation.

### Run All Unit Tests
```bash
npm test
```

### Run Tests in Watch Mode
Automatically re-runs tests when files change:
```bash
npm run test:watch
```

### Test Coverage

Currently, unit tests cover:
- ✅ **Security Model** (`spec/unit/SecuritySpec.js`)
  - Security creation and metadata
  - Symbol validation
  - Price data fetching

- ✅ **Strategy Service** (`spec/unit/StrategyServiceSpec.js`)
  - Strategy initialization (4 pre-built strategies)
  - Strategy recommendation logic
  - Strategy comparison

- ✅ **Strategy Model** (`spec/unit/StrategySpec.js`)
  - Signal generation
  - Indicator combination
  - Frequency recommendations

- ✅ **Indicator Service** (`spec/unit/IndicatorServiceSpec.js`)
  - All 5 indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
  - Signal calculation
  - Error handling

### Expected Output
```
Started
..................................
73 specs, 0 failures
Finished in 0.017 seconds
```

---

## 2. Testing the API Server

### Start the Server

First, make sure you have your Alpha Vantage API key set:
```bash
export ALPHA_VANTAGE_API_KEY="your_api_key_here"
```

Then start the server:
```bash
npm start
```

You should see:
```
HorizonTrader server running on http://localhost:3000
Available endpoints:
  POST /portfolio/initialize - Create portfolio with tickers + horizon
  GET  /portfolio/:id/signals - Current buy/hold/sell signals
  ...
```

### Health Check

Test if the server is running:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "HorizonTrader",
  "timestamp": "2024-10-28T12:00:00.000Z"
}
```

---

## 3. Manual API Testing

### Test 1: Initialize a Portfolio

```bash
curl -X POST http://localhost:3000/portfolio/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "tickers": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
    "horizon": 2
  }'
```

**Expected Response:**
```json
{
  "portfolioId": "portfolio_1234567890",
  "horizon": 2,
  "securities": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "exchange": "NASDAQ",
      "sector": "Technology"
    },
    ...
  ],
  "validationResults": [...],
  "message": "Portfolio initialized with 5 valid securities"
}
```

**Save the portfolioId** for subsequent tests!

### Test 2: Get Portfolio Signals

Replace `PORTFOLIO_ID` with the ID from Test 1:
```bash
curl http://localhost:3000/portfolio/PORTFOLIO_ID/signals
```

**Expected Response:**
```json
{
  "portfolioId": "portfolio_1234567890",
  "strategy": "mean_reversion",
  "signals": [
    {
      "ticker": "AAPL",
      "signal": "buy",
      "confidence": 0.75,
      "reason": "RSI shows buy signal, BollingerBands shows buy signal",
      "indicators": {
        "RSI": {...},
        "BOLLINGER": {...}
      }
    },
    ...
  ],
  "timestamp": "2024-10-28T12:00:00.000Z"
}
```

### Test 3: Get Strategy Recommendation

```bash
curl http://localhost:3000/portfolio/PORTFOLIO_ID/strategy
```

**Expected Response:**
```json
{
  "portfolioId": "portfolio_1234567890",
  "strategy": {
    "name": "Mean Reversion",
    "description": "Identifies overbought/oversold conditions for contrarian trades",
    "frequency": "daily",
    "indicators": ["RSI", "BOLLINGER"],
    "confidence": 0.6
  },
  "recommendation": "Medium-term horizon allows for balanced approach. Medium risk tolerance suggests balanced approach. Mean reversion captures short-term price reversals.",
  "timestamp": "2024-10-28T12:00:00.000Z"
}
```

### Test 4: Get Portfolio Performance

```bash
curl http://localhost:3000/portfolio/PORTFOLIO_ID/performance
```

**Expected Response:**
```json
{
  "portfolioId": "portfolio_1234567890",
  "performance": {
    "totalValue": 100000,
    "totalReturn": 0,
    "annualizedReturn": 0,
    "cash": 100000,
    "unrealizedPnl": 0,
    "horizon": 2
  },
  "positions": [...],
  "timestamp": "2024-10-28T12:00:00.000Z"
}
```

### Test 5: Run Backtest (Placeholder)

```bash
curl -X POST http://localhost:3000/backtest \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "PORTFOLIO_ID",
    "startDate": "2020-01-01",
    "endDate": "2023-12-31"
  }'
```

### Test 6: Get Paper Trading Status (Placeholder)

```bash
curl http://localhost:3000/portfolio/PORTFOLIO_ID/paper-trading
```

### Test 7: Generate Coupled Trade (Placeholder)

```bash
curl -X POST http://localhost:3000/coupled-trade \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "PORTFOLIO_ID",
    "method": "pairs"
  }'
```

---

## 4. Integration Testing

Integration tests verify that multiple components work together.

### Setup Integration Tests

Create the integration test directory:
```bash
mkdir -p spec/integration
```

### Example Integration Test

Create `spec/integration/portfolioFlowSpec.js`:

```javascript
const http = require('http');

describe('Portfolio Flow Integration', () => {
  const baseUrl = 'http://localhost:3000';
  let portfolioId;

  beforeAll((done) => {
    // Wait for server to be ready
    setTimeout(done, 1000);
  });

  it('should create a portfolio and get signals', async () => {
    // Initialize portfolio
    const initResponse = await makeRequest('POST', '/portfolio/initialize', {
      tickers: ['AAPL', 'MSFT'],
      horizon: 2
    });
    
    expect(initResponse.portfolioId).toBeDefined();
    portfolioId = initResponse.portfolioId;

    // Get signals
    const signalsResponse = await makeRequest('GET', `/portfolio/${portfolioId}/signals`);
    expect(signalsResponse.signals).toBeDefined();
    expect(Array.isArray(signalsResponse.signals)).toBe(true);
  });

  function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }
});
```

### Run Integration Tests

```bash
npm run test:integration
```

**Note:** Integration tests require the server to be running. Start the server in one terminal:
```bash
npm start
```

Then run integration tests in another terminal.

---

## 5. Testing Checklist

### Pre-deployment Testing

- [ ] All unit tests pass (`npm test`)
- [ ] Server starts without errors (`npm start`)
- [ ] Health check endpoint responds
- [ ] Can create a portfolio
- [ ] Can get signals for a portfolio
- [ ] Can get strategy recommendations
- [ ] Can get performance metrics
- [ ] API error handling works (test with invalid portfolio ID)
- [ ] Rate limiting works (test with multiple rapid requests)

### Testing Individual Components

- [ ] **Technical Indicators**: Test each indicator with mock data
- [ ] **Strategies**: Test each of the 4 strategies
- [ ] **Portfolio**: Test rebalancing, trade execution
- [ ] **Market Data Provider**: Test caching, rate limiting

---

## 6. Troubleshooting

### Tests Fail with "Cannot find module"
```bash
npm install
```

### API Returns "Portfolio not found"
Make sure you're using the correct portfolio ID from the initialize response.

### Rate Limiting Errors
Alpha Vantage free tier allows 5 calls/minute. If tests are failing due to rate limits:
- Use cached data (already implemented)
- Add delays between API calls in tests
- Use mock data for testing

### Server Won't Start
1. Check if port 3000 is already in use
2. Verify Alpha Vantage API key is set:
   ```bash
   echo $ALPHA_VANTAGE_API_KEY
   ```

---

## 7. Performance Testing

### Load Testing

Test with multiple concurrent requests:
```bash
# Install Apache Bench (if available)
ab -n 100 -c 10 http://localhost:3000/health
```

Or use a simple Node.js script to test concurrent portfolio creation.

---

## Quick Reference

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Start server
npm start

# Health check
curl http://localhost:3000/health

# Create portfolio
curl -X POST http://localhost:3000/portfolio/initialize \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL"], "horizon": 2}'
```

---

For more details, see the main [README.md](README.md) file.

