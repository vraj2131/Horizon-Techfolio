# HorizonTrader Project Plan

## Project Overview

Develop a Web-based app for individuals with modest knowledge of investing in stock markets.

### Target Users
- Individual investors
- Basic understanding of stock markets
- Managing portfolios of ~20 different companies

## Core Requirements

### 1. Investment Horizon Selection
- **Requirement**: Users can choose investment horizon as 1, 2, or 5 years
- **Status**: ✅ **Complete**
- **Implementation**: 
  - Portfolio initialization accepts horizon parameter
  - Strategy recommendations adjust based on horizon
  - Trading frequency recommendations adapt to horizon length

### 2. Portfolio Management
- **Requirement**: Portfolio contains around 20 different companies
- **Status**: ✅ **Complete**
- **Implementation**:
  - Portfolio model supports up to 20 positions
  - Security validation and tracking
  - Position management with buy/sell operations
  - Performance tracking and metrics

### 3. Technical Analysis
- **Requirement**: Provide investment suggestions based on technical analysis of historical stock price movements (last 20 years)
- **Status**: ✅ **Complete**
- **Implementation**:
  - ✅ SMA (Simple Moving Average)
  - ✅ EMA (Exponential Moving Average)
  - ✅ RSI (Relative Strength Index)
  - ✅ MACD (Moving Average Convergence Divergence)
  - ✅ Bollinger Bands
  - Historical data fetching from Alpha Vantage API (20+ years available)
  - Signal generation (Buy/Hold/Sell) for each indicator

### 4. Trading Strategy & Frequency
- **Requirement**: Trading advice includes the trading strategy and suggested frequency of trading
- **Status**: ✅ **Complete**
- **Implementation**:
  - ✅ 4 Pre-built Strategies:
    - Trend Following
    - Mean Reversion
    - Momentum
    - Conservative
  - ✅ Strategy recommendation based on horizon and risk tolerance
  - ✅ Trading frequency recommendations (daily/weekly/monthly)

### 5. Coupled Investments
- **Requirement**: Consider coupled investments where several different stocks are simultaneously traded (bought or sold), optimized to hedge investment risks
- **Status**: 🟡 **Partially Complete**
- **Implementation**:
  - ✅ API endpoint (`POST /coupled-trade`)
  - ⏳ Pairs trading logic
  - ⏳ Beta hedging calculations
  - ⏳ Risk management and hedge ratio optimization

### 6. Basket Trading
- **Requirement**: Functionality to place orders in bulk for "basket trading" - aggregating trades over multiple users buying the same stock
- **Status**: ⏳ **Not Started**
- **Implementation**:
  - ⏳ Order aggregation system
  - ⏳ Multi-user trade matching
  - ⏳ Cost reduction simulation

## Development Phases

### ✅ Phase 1: Core Infrastructure (COMPLETE)
- [x] Pure Node.js HTTP server (no Express framework)
- [x] Alpha Vantage API integration
- [x] Security and Portfolio models
- [x] Basic API endpoints
- [x] Caching system for market data
- [x] Rate limiting (respects API limits)
- [x] **Database setup with MongoDB Atlas** ✨

### ✅ Phase 2: Technical Indicators (COMPLETE)
- [x] SMA implementation
- [x] EMA implementation
- [x] RSI implementation
- [x] MACD implementation
- [x] Bollinger Bands implementation
- [x] Signal generation logic for all indicators

### ✅ Phase 3: Strategy Engine (COMPLETE)
- [x] Trend Following strategy
- [x] Mean Reversion strategy
- [x] Momentum strategy
- [x] Conservative strategy
- [x] Strategy recommendation algorithm
- [x] Trading frequency recommendations

### ✅ Phase 4: Portfolio Management (COMPLETE)
- [x] Position tracking
- [x] Rebalancing logic
- [x] Performance metrics calculation
- [x] Trade execution (buy/sell)
- [x] Cost basis tracking
- [x] P&L calculations

### 🟡 Phase 5: Backtesting (IN PROGRESS)
- [x] API endpoint created
- [x] Database model for backtest sessions
- [ ] Historical simulation engine
- [ ] Walk-forward analysis
- [ ] Performance metrics (CAGR, Sharpe Ratio, Max Drawdown)
- [ ] Cost modeling (commissions, slippage)
- [ ] Benchmark comparison

### 🟡 Phase 6: Paper Trading (IN PROGRESS)
- [x] API endpoint created
- [x] Database model for paper trading sessions
- [ ] Real-time price validation
- [ ] Paper trade execution tracking
- [ ] Performance tracking vs. actual market
- [ ] Deviation alerts
- [ ] Performance analytics

### 🟡 Phase 7: Coupled Trades (IN PROGRESS)
- [x] API endpoint created
- [ ] Pairs trading implementation
- [ ] Correlation analysis
- [ ] Beta hedging calculations
- [ ] Hedge ratio optimization
- [ ] Risk management
- [ ] Multi-leg trade execution

### ⏳ Phase 8: Basket Trading (NOT STARTED)
- [ ] Order aggregation system
- [ ] Multi-user trade matching
- [ ] Cost reduction calculation
- [ ] Trade optimization
- [ ] User queue management

## Technical Architecture

### Backend Stack
- **Runtime**: Node.js 14.0.0+
- **Framework**: Pure Node.js (no Express - course requirement)
- **Database**: MongoDB Atlas (cloud) with Mongoose
- **API Integration**: Alpha Vantage for market data
- **Testing**: Jasmine

### Data Flow
1. User creates portfolio with tickers and horizon
2. System validates tickers via Alpha Vantage API
3. System fetches historical price data (with caching)
4. Technical indicators calculated for each stock
5. Strategy recommendation generated based on horizon
6. Trading signals (Buy/Hold/Sell) generated
7. Portfolio performance tracked
8. Backtest/Paper Trading sessions stored in database

## Database Schema

### Collections
1. **portfolios** - Portfolio configurations and positions
2. **backtestsessions** - Historical backtest results
3. **papertradingsessions** - Real-time paper trading data

## API Endpoints

### Portfolio Management
- `POST /portfolio/initialize` - Create portfolio ✅
- `GET /portfolio/:id/signals` - Get trading signals ✅
- `GET /portfolio/:id/strategy` - Get recommended strategy ✅
- `GET /portfolio/:id/performance` - Get performance metrics ✅

### Backtesting & Validation
- `POST /backtest` - Run historical backtest 🟡
- `GET /portfolio/:id/paper-trading` - Paper trading status 🟡

### Advanced Features
- `POST /coupled-trade` - Generate hedged trade 🟡
- `GET /health` - Health check ✅

## Current Progress Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Core Infrastructure | ✅ Complete | 100% |
| Phase 2: Technical Indicators | ✅ Complete | 100% |
| Phase 3: Strategy Engine | ✅ Complete | 100% |
| Phase 4: Portfolio Management | ✅ Complete | 90% |
| Phase 5: Backtesting | 🟡 In Progress | 20% |
| Phase 6: Paper Trading | 🟡 In Progress | 20% |
| Phase 7: Coupled Trades | 🟡 In Progress | 10% |
| Phase 8: Basket Trading | ⏳ Not Started | 0% |

**Overall Progress: ~60-70%**

## Next Steps (Priority Order)

### High Priority
1. **Backtesting Engine** (Phase 5)
   - Implement historical simulation
   - Calculate performance metrics
   - Add cost modeling

2. **Paper Trading** (Phase 6)
   - Real-time validation
   - Performance tracking

### Medium Priority
3. **Coupled Trades** (Phase 7)
   - Pairs trading logic
   - Hedging calculations

### Low Priority
4. **Basket Trading** (Phase 8)
   - Order aggregation
   - Multi-user matching

## Testing Requirements

- [x] Unit tests for all indicators
- [x] Unit tests for strategies
- [x] Unit tests for portfolio operations
- [ ] Integration tests for API endpoints
- [ ] End-to-end tests for full workflows
- [ ] Performance tests for large portfolios

## Deployment Considerations

- ✅ Database: MongoDB Atlas (cloud, accessible by team)
- ✅ Environment variables for configuration
- ⏳ Docker containerization (optional)
- ⏳ CI/CD pipeline (optional)

## Team Responsibilities (Suggested)

- **Backend Development**: All team members
- **Backtesting**: [Assign team member]
- **Paper Trading**: [Assign team member]
- **Coupled Trades**: [Assign team member]
- **Testing**: [Assign team member]
- **Documentation**: [Assign team member]

---

**Last Updated**: Based on current project state
**Project Start**: [Date when project began]
**Expected Completion**: [Target date]

