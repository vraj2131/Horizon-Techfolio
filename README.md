# HorizonTrader: Technical Analysis Portfolio Management System

A server-side application that provides technical analysis-based recommendations for individual investors managing ~20-stock portfolios across 1, 2, or 5-year horizons.

## Team Members
- Nithik Pandya
- Ayush Dodia  
- Vraj Shah

## System Overview

HorizonTrader computes technical indicators, derives strategy signals (Buy/Hold/Sell), recommends trading frequency, supports coupled (hedged) multi-leg trades, and validates ideas via historical backtesting and real-time paper trading.

### Key Features
- **Technical Analysis**: SMA, EMA, RSI, MACD, Bollinger Bands
- **Strategy Recommendations**: 4 pre-built strategies with frequency recommendations
- **Portfolio Management**: Track ~20 stocks with rebalancing
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
- Alpha Vantage API key (free tier: 5 calls/min, 500/day)

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   export ALPHA_VANTAGE_API_KEY="your_api_key_here"
   ```
4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

The server runs on `http://localhost:3000` and provides the following endpoints:

### Portfolio Management
- `POST /portfolio/initialize` - Create portfolio with tickers + horizon
- `GET /portfolio/:id/signals` - Current buy/hold/sell signals
- `GET /portfolio/:id/strategy` - Recommended strategy + frequency
- `GET /portfolio/:id/performance` - Current performance metrics

### Backtesting & Validation
- `POST /backtest` - Run historical backtest, return metrics
- `GET /portfolio/:id/paper-trading` - Current paper trading status

### Advanced Features
- `POST /coupled-trade` - Generate hedged trade recommendation

### System
- `GET /health` - Health check
- `GET /` - API information

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

### Pure Node.js Server
- No Express framework (course requirement)
- Manual HTTP routing and JSON parsing
- Built-in CORS support

### Data Management
- Alpha Vantage API for market data
- Aggressive caching to minimize API calls
- In-memory storage for portfolios/sessions

### Rate Limiting
- Respects Alpha Vantage free tier limits
- Automatic retry with exponential backoff
- Graceful degradation when rate limited

## Development Status

### Phase 1: Core Infrastructure ✅
- [x] Node.js HTTP server setup
- [x] Alpha Vantage integration
- [x] Security and Portfolio models
- [x] Basic API endpoints
- [x] Caching and rate limiting

### Phase 2: Technical Indicators (In Progress)
- [ ] SMA, EMA, RSI, MACD, Bollinger Bands
- [ ] Signal generation logic
- [ ] Indicator service implementation

### Phase 3: Strategy Engine (Planned)
- [ ] 4 pre-built strategies
- [ ] Trading frequency recommendations
- [ ] Strategy service implementation

### Phase 4: Portfolio Management (Planned)
- [ ] Position tracking
- [ ] Rebalancing logic
- [ ] Performance metrics

### Phase 5: Backtesting (Planned)
- [ ] Historical simulation
- [ ] Performance metrics (CAGR, Sharpe, Drawdown)
- [ ] Cost modeling

### Phase 6: Paper Trading (Planned)
- [ ] Real-time validation
- [ ] Performance tracking
- [ ] Deviation alerts

### Phase 7: Coupled Trades (Planned)
- [ ] Pairs trading
- [ ] Beta hedging
- [ ] Risk management

### Phase 8: Basket Trading (Planned)
- [ ] Order aggregation
- [ ] Cost reduction simulation

## License

MIT License - see LICENSE file for details

## Contributing

This is a course project. Please refer to the course guidelines for contribution rules.

## AI Code Generation

This project uses AI assistance for code generation. All AI-generated code is reviewed, tested, and documented. Issues encountered with AI-generated code are tracked for the course report.

### Known Issues
- AI sometimes generates Express code despite pure Node.js requirement
- Indicator calculations may have look-ahead bias without proper validation
- API error handling needs manual review for completeness

### AI Prompts Used
- "Generate Jasmine unit tests for RSI indicator calculation"
- "Create integration test for portfolio rebalancing endpoint"
- "Write test cases for coupled trade hedge ratio calculation"





