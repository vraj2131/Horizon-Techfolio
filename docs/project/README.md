# HorizonTrader: Technical Analysis Portfolio Management System

A server-side application that provides technical analysis-based recommendations for individual investors managing ~20-stock portfolios across 1, 2, or 5-year horizons.

## Team Members
- Ayush Dodia
- Nithik Pandya
- Vraj Shah

## System Overview

HorizonTrader computes technical indicators, derives strategy signals (Buy/Hold/Sell), recommends trading frequency, supports coupled (hedged) multi-leg trades, and validates ideas via historical backtesting and real-time paper trading.

### Key Features
- **Technical Analysis**: SMA, EMA, RSI, MACD, Bollinger Bands
- **Strategy Recommendations**: 4 pre-built strategies with frequency recommendations
- **Portfolio Management**: Track ~20 stocks with rebalancing
- **Trading System**: Buy/sell stocks with dummy money, wallet management, transaction tracking
- **User Authentication**: Secure login and registration with JWT tokens
- **Backtesting**: Historical performance with realistic costs
- **Paper Trading**: Real-time validation against current prices
- **Coupled Trades**: Pairs trading and hedging strategies
- **Basket Trading**: Simulated order aggregation

## Architecture

### Core Models
- **Security**: Represents individual stocks with price data access
- **Position**: Tracks holdings in a single security
- **Portfolio**: Manages complete collection of holdings
- **TechnicalIndicator**: Computes technical analysis signals
- **Strategy**: Combines indicators into trading decisions
- **CoupledTrade**: Implements hedged trading strategies
- **BacktestSession**: Simulates historical performance

### Services
- **MarketDataProvider**: Alpha Vantage API integration with caching
- **IndicatorService**: Technical indicator calculations
- **StrategyService**: Strategy implementation and recommendations
- **BacktestService**: Historical simulation engine
- **PaperTradingService**: Real-time validation

## Installation

### Prerequisites
- Node.js 14.0.0 or higher
- MongoDB Atlas account (or local MongoDB instance)
- Alpha Vantage API key(s) (free tier: 5 calls/min, 500/day)

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and add your credentials:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ALPHA_VANTAGE_API_KEY=your_primary_api_key
   ALPHA_VANTAGE_API_KEY_2=your_secondary_api_key (optional)
   JWT_SECRET=your_secure_jwt_secret
   NODE_ENV=development
   PORT=3000
   ```
5. Start the server:
   ```bash
   npm start
   ```
6. (Optional) Populate database with historical data:
   ```bash
   npm run populate-db
   ```

## API Endpoints

The server runs on `http://localhost:3000` and provides the following endpoints:

### User Management
- `POST /user` - Create new user
- `POST /login` - User login (returns JWT token)
- `POST /verify` - Verify JWT token
- `GET /user/:userId/portfolios` - Get user's portfolios

### Portfolio Management
- `POST /portfolio/initialize` - Create portfolio with tickers + horizon
- `GET /portfolio/:id/signals` - Current buy/hold/sell signals
- `GET /portfolio/:id/strategy` - Recommended strategy + frequency
- `GET /portfolio/:id/performance` - Current performance metrics

### Trading & Wallet
- `GET /wallet/:userId` - Get wallet details
- `POST /wallet/buy` - Buy stocks
- `POST /wallet/sell` - Sell stocks
- `POST /wallet/deposit` - Deposit funds (demo)
- `GET /wallet/:userId/transactions` - Transaction history
- `GET /wallet/:userId/holdings` - View all holdings
- `GET /wallet/:userId/summary` - Complete wallet summary

### Stock Data
- `POST /stocks/search` - Validate stock tickers
- `GET /stocks/popular` - Get popular stock list
- `GET /stocks/available` - Get stocks with data in database

### Backtesting & Validation
- `POST /backtest` - Run historical backtest, return metrics
- `GET /portfolio/:id/paper-trading` - Current paper trading status

### Advanced Features
- `POST /coupled-trade` - Generate hedged trade recommendation

### System
- `GET /health` - Health check
- `GET /api` - API information

## Usage Examples

### Initialize Portfolio
```bash
curl -X POST http://localhost:3000/portfolio/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "tickers": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
    "horizon": 2
  }'
```

### Get Portfolio Signals
```bash
curl http://localhost:3000/portfolio/1234567890/signals
```

### Run Backtest
```bash
curl -X POST http://localhost:3000/backtest \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "1234567890",
    "startDate": "2020-01-01",
    "endDate": "2023-12-31"
  }'
```

## Configuration

Edit `config/config.js` to customize:
- Alpha Vantage API settings
- Trading parameters (commission, slippage)
- Cache settings
- Backtesting defaults

## Testing

Run unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Technical Implementation

### Express.js Server
- **Production-ready Express.js setup**
- Modular router architecture
- Comprehensive middleware stack:
  - **Security**: Helmet for HTTP headers
  - **Logging**: Morgan for request logging  
  - **Compression**: Gzip compression for responses
  - **Rate Limiting**: Express-rate-limit (100 req/15min global, 5 req/15min for auth)
  - **Validation**: Express-validator for request validation
  - **Error Handling**: Centralized error middleware
  - **CORS**: Configurable cross-origin support

### Data Management
- **MongoDB Atlas** with Mongoose ODM
- Alpha Vantage API for market data
- 10 years of historical data for 20 stocks
- API key rotation for rate limit management
- Aggressive caching to minimize API calls
- Daily automated updates via cron jobs

### Rate Limiting
- Global rate limit: 100 requests per 15 minutes
- Authentication rate limit: 5 attempts per 15 minutes
- Respects Alpha Vantage free tier limits (5 calls/min, 500/day)
- Automatic API key rotation between multiple keys
- Graceful degradation when rate limited

## Development Status

### Phase 1: Core Infrastructure ✅
- [x] Node.js HTTP server setup
- [x] Alpha Vantage integration
- [x] Security and Portfolio models
- [x] Basic API endpoints
- [x] Caching and rate limiting

### Phase 2: Technical Indicators ✅
- [x] SMA, EMA, RSI, MACD, Bollinger Bands
- [x] Signal generation logic
- [x] Indicator service implementation

### Phase 3: Strategy Engine ✅
- [x] 4 pre-built strategies
- [x] Trading frequency recommendations
- [x] Strategy service implementation

### Phase 4: Portfolio Management ✅
- [x] Position tracking
- [x] Rebalancing logic
- [x] Performance metrics

### Phase 5: Backtesting 🟡 (Partially Complete)
- [x] API endpoint (`POST /backtest`)
- [ ] Historical simulation engine
- [ ] Performance metrics (CAGR, Sharpe, Drawdown)
- [ ] Cost modeling

### Phase 6: Paper Trading 🟡 (Partially Complete)
- [x] API endpoint (`GET /portfolio/:id/paper-trading`)
- [ ] Real-time validation
- [ ] Performance tracking
- [ ] Deviation alerts

### Phase 7: Coupled Trades 🟡 (Partially Complete)
- [x] API endpoint (`POST /coupled-trade`)
- [ ] Pairs trading
- [ ] Beta hedging
- [ ] Risk management

### Phase 8: Basket Trading (Planned)
- [ ] Order aggregation
- [ ] Cost reduction simulation

## License

MIT License - see LICENSE file for details

## Documentation

For detailed documentation, see the `/docs` directory:
- **Setup Guides**: `/docs/setup/` - Environment, database, cron, indicators
- **Migration Docs**: `/docs/migration/` - Express.js migration details
- **Project Plan**: `/docs/project/` - Development roadmap

## Contributing

This is a course project. Please refer to the course guidelines for contribution rules.

## AI Code Generation

This project uses AI assistance for code generation. All AI-generated code is reviewed, tested, and documented.






