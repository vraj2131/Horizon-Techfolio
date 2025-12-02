# Report Section 1: Project Overview

## 1. Project Overview: Purpose and Key Functional Features

### 1.1 Purpose

Horizon Trading Platform is a comprehensive web-based technical analysis and portfolio management system designed to assist individual investors in making informed trading decisions. The platform provides real-time market data analysis, automated trading signal generation, and portfolio management capabilities for investors managing approximately 20-stock portfolios across 1, 2, or 5-year investment horizons.

The primary purpose of the system is to:

1. **Democratize Technical Analysis**: Make advanced technical analysis tools accessible to individual investors without requiring extensive financial knowledge or expensive trading software.

2. **Provide Actionable Trading Signals**: Generate clear Buy/Hold/Sell recommendations based on multiple technical indicators, helping users make informed trading decisions.

3. **Enable Risk-Free Learning**: Allow users to practice trading strategies using virtual money (paper trading) without financial risk, making it an educational tool for learning about stock market investing.

4. **Support Portfolio Management**: Help users track and manage their stock portfolios with features like position tracking, performance monitoring, and transaction history.

5. **Validate Trading Strategies**: Enable users to backtest trading strategies against historical data to evaluate potential performance before implementing them in real trading scenarios.

The system addresses the common challenges faced by individual investors, including:
- Lack of access to professional-grade technical analysis tools
- Difficulty in interpreting market indicators and signals
- Need for portfolio tracking and performance monitoring
- Desire to test strategies before risking real capital
- Complexity of managing multiple stocks across different time horizons

### 1.2 Key Functional Features

The Horizon Trading Platform implements a comprehensive set of features organized into the following functional areas:

#### 1.2.1 User Authentication and Management

**Purpose**: Secure user access and account management

**Features**:
- **User Registration**: New users can create accounts with email and password
- **Secure Login**: JWT-based authentication system with password hashing using bcrypt
- **Session Management**: Token-based session handling with automatic expiration
- **User Profiles**: Each user has a unique profile with personalized dashboard and settings
- **Account Security**: Password encryption and secure token storage

**User Benefits**: 
- Secure access to personal trading data
- Privacy protection for portfolio information
- Multi-user support for different investors

#### 1.2.2 Technical Analysis and Indicators

**Purpose**: Provide advanced technical analysis tools for stock evaluation

**Features**:
- **Simple Moving Average (SMA)**: Calculates average closing prices over configurable periods (20, 50, 200 days) to identify trend direction
- **Exponential Moving Average (EMA)**: Weighted moving average that gives more importance to recent prices, providing faster trend signals
- **Relative Strength Index (RSI)**: Momentum oscillator (0-100 scale) that identifies overbought (>70) and oversold (<30) conditions
- **Moving Average Convergence Divergence (MACD)**: Trend-following momentum indicator that shows relationships between two EMAs
- **Bollinger Bands**: Volatility indicator using standard deviations to identify potential price breakouts and reversals

**User Benefits**:
- Access to professional-grade technical indicators
- Visual representation of indicator values on stock charts
- Educational content explaining how each indicator works
- Real-time calculation based on current market data

#### 1.2.3 Trading Strategy Recommendations

**Purpose**: Generate intelligent trading recommendations based on technical analysis

**Features**:
- **Four Pre-built Strategies**:
  - **Trend Following**: Uses SMA crossovers for identifying long-term trends
  - **Mean Reversion**: Combines RSI and Bollinger Bands for short-term reversals
  - **Momentum**: Utilizes MACD and EMA for capturing price momentum
  - **Conservative**: Multi-indicator consensus for risk-averse investors
- **Strategy Selection**: Automatic strategy recommendation based on investment horizon (1, 2, or 5 years)
- **Trading Frequency Recommendations**: Suggests optimal rebalancing frequency (daily, weekly, or monthly) based on strategy type and portfolio characteristics
- **Signal Generation**: Generates Buy/Hold/Sell signals for each stock in the portfolio
- **Confidence Scoring**: Provides confidence levels for each recommendation

**User Benefits**:
- Personalized strategy recommendations
- Clear action signals (Buy/Hold/Sell)
- Understanding of why specific recommendations are made
- Optimization for different investment timeframes

#### 1.2.4 Portfolio Management

**Purpose**: Enable users to create, track, and manage stock portfolios

**Features**:
- **Portfolio Creation**: Initialize portfolios with up to 20 stocks and specify investment horizon
- **Portfolio Naming**: Custom names for easy identification
- **Position Tracking**: Real-time tracking of:
  - Number of shares held
  - Average cost basis
  - Current market value
  - Unrealized profit/loss (both dollar and percentage)
- **Cash Management**: Track available cash balance and initial capital
- **Portfolio Performance Metrics**:
  - Total portfolio value (cash + positions)
  - Overall profit/loss
  - Return on investment (ROI)
  - Performance comparison against initial capital
- **Multiple Portfolios**: Users can create and manage multiple portfolios simultaneously
- **Portfolio Viewing**: Detailed view of each portfolio with all positions and performance metrics

**User Benefits**:
- Centralized portfolio tracking
- Real-time valuation of holdings
- Performance monitoring and analysis
- Support for multiple investment strategies

#### 1.2.5 Virtual Trading System

**Purpose**: Allow users to practice trading with virtual money

**Features**:
- **Virtual Wallet**: Each user has a virtual wallet with initial balance ($10,000 default)
- **Stock Buying**: Purchase stocks at current market prices with virtual funds
- **Stock Selling**: Sell owned stocks and realize profits/losses
- **Transaction Tracking**: Complete history of all buy/sell transactions with:
  - Transaction date and time
  - Stock ticker and quantity
  - Price per share
  - Total transaction value
  - Commission and fees
  - Realized profit/loss (for sell transactions)
- **Holdings Management**: View all current stock holdings with:
  - Current market value
  - Unrealized profit/loss
  - Percentage gains/losses
- **Fund Deposits**: Ability to add virtual funds to wallet (for testing/demo purposes)
- **Transaction Filtering**: Filter transactions by:
  - Transaction type (buy/sell)
  - Stock ticker
  - Date range
- **Performance Statistics**:
  - Total buy orders and amount
  - Total sell orders and amount
  - Net cash flow
  - Realized profit/loss from closed positions

**User Benefits**:
- Risk-free trading practice
- Learning trading mechanics without financial risk
- Testing different trading strategies
- Understanding transaction costs and fees

#### 1.2.6 Stock Data and Market Information

**Purpose**: Provide comprehensive stock market data and information

**Features**:
- **Real-time Stock Quotes**: Current market prices fetched from Alpha Vantage API
- **Historical Price Data**: 10 years of historical daily price data stored in database
- **Stock Search and Validation**: Validate stock tickers before adding to portfolio
- **Popular Stocks List**: Pre-configured list of 20 popular US stocks
- **Stock Details Page**: Comprehensive information for each stock including:
  - Current price and daily change
  - Historical price charts
  - Technical indicators
  - Trading signals
  - Company information
- **Watchlist**: Maintain a list of stocks to monitor
- **Daily Price Updates**: Automated daily updates of stock prices via cron jobs
- **Data Caching**: Aggressive caching to minimize API calls and improve performance

**User Benefits**:
- Access to real-time and historical market data
- Reliable data source (Alpha Vantage API)
- Fast data retrieval through caching
- Comprehensive stock information

#### 1.2.7 Educational Content

**Purpose**: Educate users about technical analysis and trading concepts

**Features**:
- **Learn Technical Indicators**: Interactive educational section explaining:
  - How each indicator works (concept and formula)
  - Trading signals generated by each indicator
  - Pro tips for using indicators effectively
- **Interactive Calculator**: Visual calculator demonstrating indicator calculations with sample data
- **Step-by-step Navigation**: Guided tour through different indicators
- **Visual Examples**: Charts and examples showing indicator behavior

**User Benefits**:
- Understanding of technical analysis concepts
- Learning how to interpret trading signals
- Building confidence in using the platform
- Educational resource for trading knowledge

#### 1.2.8 Stock Recommendations

**Purpose**: Provide personalized stock recommendations based on technical analysis

**Features**:
- **Individual Stock Analysis**: Get recommendations for specific stocks
- **Multi-indicator Analysis**: Recommendations based on multiple technical indicators
- **Confidence Scoring**: Confidence levels for each recommendation
- **Reasoning Explanation**: Detailed explanation of why a recommendation is made
- **Strategy-based Recommendations**: Recommendations aligned with selected trading strategy

**User Benefits**:
- Data-driven stock selection
- Understanding of recommendation rationale
- Confidence in trading decisions

#### 1.2.9 Backtesting (Partial Implementation)

**Purpose**: Test trading strategies against historical data

**Features**:
- **API Endpoint**: Backend support for backtesting requests
- **Historical Simulation**: (Planned) Simulate trading strategies using past market data
- **Performance Metrics**: (Planned) Calculate metrics like CAGR, Sharpe ratio, and maximum drawdown

**Status**: Endpoint exists but full simulation engine is not yet implemented

#### 1.2.10 Paper Trading (Partial Implementation)

**Purpose**: Real-time validation of trading strategies

**Features**:
- **API Endpoint**: Backend support for paper trading sessions
- **Real-time Tracking**: (Planned) Track paper trading performance in real-time
- **Performance Comparison**: (Planned) Compare paper trading results with backtested expectations

**Status**: Endpoint exists but real-time validation is not yet fully implemented

#### 1.2.11 System Administration and Security

**Purpose**: Ensure system security and reliability

**Features**:
- **Rate Limiting**: Protection against API abuse (100 requests/15min global, 5 requests/15min for authentication)
- **Security Headers**: Helmet.js for HTTP security headers
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Input Validation**: All user inputs validated before processing
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Logging**: Request logging for debugging and monitoring
- **Database Connection Management**: Graceful handling of database connection issues with in-memory fallback

**User Benefits**:
- Secure platform
- Protection against abuse
- Reliable system operation
- Data integrity

### 1.3 Target Users

The system is designed for:

1. **Individual Investors**: Retail investors managing personal stock portfolios
2. **Trading Learners**: People learning about stock trading and technical analysis
3. **Strategy Testers**: Investors wanting to test trading strategies before using real money
4. **Portfolio Managers**: Users managing multiple portfolios with different strategies

### 1.4 System Capabilities Summary

The Horizon Trading Platform successfully provides:

- ✅ Complete user authentication and account management
- ✅ Real-time stock market data integration
- ✅ Five major technical indicators with signal generation
- ✅ Four trading strategies with automatic recommendations
- ✅ Full portfolio management with position tracking
- ✅ Virtual trading system with transaction history
- ✅ Educational content for learning technical analysis
- ✅ Stock recommendations based on technical analysis
- ✅ Comprehensive transaction and performance tracking
- 🟡 Backtesting framework (partially implemented)
- 🟡 Paper trading validation (partially implemented)

The system demonstrates a production-ready implementation of core trading and portfolio management features, with a solid foundation for future enhancements in backtesting and advanced trading strategies.




## 1. Project Overview: Purpose and Key Functional Features

### 1.1 Purpose

Horizon Trading Platform is a comprehensive web-based technical analysis and portfolio management system designed to assist individual investors in making informed trading decisions. The platform provides real-time market data analysis, automated trading signal generation, and portfolio management capabilities for investors managing approximately 20-stock portfolios across 1, 2, or 5-year investment horizons.

The primary purpose of the system is to:

1. **Democratize Technical Analysis**: Make advanced technical analysis tools accessible to individual investors without requiring extensive financial knowledge or expensive trading software.

2. **Provide Actionable Trading Signals**: Generate clear Buy/Hold/Sell recommendations based on multiple technical indicators, helping users make informed trading decisions.

3. **Enable Risk-Free Learning**: Allow users to practice trading strategies using virtual money (paper trading) without financial risk, making it an educational tool for learning about stock market investing.

4. **Support Portfolio Management**: Help users track and manage their stock portfolios with features like position tracking, performance monitoring, and transaction history.

5. **Validate Trading Strategies**: Enable users to backtest trading strategies against historical data to evaluate potential performance before implementing them in real trading scenarios.

The system addresses the common challenges faced by individual investors, including:
- Lack of access to professional-grade technical analysis tools
- Difficulty in interpreting market indicators and signals
- Need for portfolio tracking and performance monitoring
- Desire to test strategies before risking real capital
- Complexity of managing multiple stocks across different time horizons

### 1.2 Key Functional Features

The Horizon Trading Platform implements a comprehensive set of features organized into the following functional areas:

#### 1.2.1 User Authentication and Management

**Purpose**: Secure user access and account management

**Features**:
- **User Registration**: New users can create accounts with email and password
- **Secure Login**: JWT-based authentication system with password hashing using bcrypt
- **Session Management**: Token-based session handling with automatic expiration
- **User Profiles**: Each user has a unique profile with personalized dashboard and settings
- **Account Security**: Password encryption and secure token storage

**User Benefits**: 
- Secure access to personal trading data
- Privacy protection for portfolio information
- Multi-user support for different investors

#### 1.2.2 Technical Analysis and Indicators

**Purpose**: Provide advanced technical analysis tools for stock evaluation

**Features**:
- **Simple Moving Average (SMA)**: Calculates average closing prices over configurable periods (20, 50, 200 days) to identify trend direction
- **Exponential Moving Average (EMA)**: Weighted moving average that gives more importance to recent prices, providing faster trend signals
- **Relative Strength Index (RSI)**: Momentum oscillator (0-100 scale) that identifies overbought (>70) and oversold (<30) conditions
- **Moving Average Convergence Divergence (MACD)**: Trend-following momentum indicator that shows relationships between two EMAs
- **Bollinger Bands**: Volatility indicator using standard deviations to identify potential price breakouts and reversals

**User Benefits**:
- Access to professional-grade technical indicators
- Visual representation of indicator values on stock charts
- Educational content explaining how each indicator works
- Real-time calculation based on current market data

#### 1.2.3 Trading Strategy Recommendations

**Purpose**: Generate intelligent trading recommendations based on technical analysis

**Features**:
- **Four Pre-built Strategies**:
  - **Trend Following**: Uses SMA crossovers for identifying long-term trends
  - **Mean Reversion**: Combines RSI and Bollinger Bands for short-term reversals
  - **Momentum**: Utilizes MACD and EMA for capturing price momentum
  - **Conservative**: Multi-indicator consensus for risk-averse investors
- **Strategy Selection**: Automatic strategy recommendation based on investment horizon (1, 2, or 5 years)
- **Trading Frequency Recommendations**: Suggests optimal rebalancing frequency (daily, weekly, or monthly) based on strategy type and portfolio characteristics
- **Signal Generation**: Generates Buy/Hold/Sell signals for each stock in the portfolio
- **Confidence Scoring**: Provides confidence levels for each recommendation

**User Benefits**:
- Personalized strategy recommendations
- Clear action signals (Buy/Hold/Sell)
- Understanding of why specific recommendations are made
- Optimization for different investment timeframes

#### 1.2.4 Portfolio Management

**Purpose**: Enable users to create, track, and manage stock portfolios

**Features**:
- **Portfolio Creation**: Initialize portfolios with up to 20 stocks and specify investment horizon
- **Portfolio Naming**: Custom names for easy identification
- **Position Tracking**: Real-time tracking of:
  - Number of shares held
  - Average cost basis
  - Current market value
  - Unrealized profit/loss (both dollar and percentage)
- **Cash Management**: Track available cash balance and initial capital
- **Portfolio Performance Metrics**:
  - Total portfolio value (cash + positions)
  - Overall profit/loss
  - Return on investment (ROI)
  - Performance comparison against initial capital
- **Multiple Portfolios**: Users can create and manage multiple portfolios simultaneously
- **Portfolio Viewing**: Detailed view of each portfolio with all positions and performance metrics

**User Benefits**:
- Centralized portfolio tracking
- Real-time valuation of holdings
- Performance monitoring and analysis
- Support for multiple investment strategies

#### 1.2.5 Virtual Trading System

**Purpose**: Allow users to practice trading with virtual money

**Features**:
- **Virtual Wallet**: Each user has a virtual wallet with initial balance ($10,000 default)
- **Stock Buying**: Purchase stocks at current market prices with virtual funds
- **Stock Selling**: Sell owned stocks and realize profits/losses
- **Transaction Tracking**: Complete history of all buy/sell transactions with:
  - Transaction date and time
  - Stock ticker and quantity
  - Price per share
  - Total transaction value
  - Commission and fees
  - Realized profit/loss (for sell transactions)
- **Holdings Management**: View all current stock holdings with:
  - Current market value
  - Unrealized profit/loss
  - Percentage gains/losses
- **Fund Deposits**: Ability to add virtual funds to wallet (for testing/demo purposes)
- **Transaction Filtering**: Filter transactions by:
  - Transaction type (buy/sell)
  - Stock ticker
  - Date range
- **Performance Statistics**:
  - Total buy orders and amount
  - Total sell orders and amount
  - Net cash flow
  - Realized profit/loss from closed positions

**User Benefits**:
- Risk-free trading practice
- Learning trading mechanics without financial risk
- Testing different trading strategies
- Understanding transaction costs and fees

#### 1.2.6 Stock Data and Market Information

**Purpose**: Provide comprehensive stock market data and information

**Features**:
- **Real-time Stock Quotes**: Current market prices fetched from Alpha Vantage API
- **Historical Price Data**: 10 years of historical daily price data stored in database
- **Stock Search and Validation**: Validate stock tickers before adding to portfolio
- **Popular Stocks List**: Pre-configured list of 20 popular US stocks
- **Stock Details Page**: Comprehensive information for each stock including:
  - Current price and daily change
  - Historical price charts
  - Technical indicators
  - Trading signals
  - Company information
- **Watchlist**: Maintain a list of stocks to monitor
- **Daily Price Updates**: Automated daily updates of stock prices via cron jobs
- **Data Caching**: Aggressive caching to minimize API calls and improve performance

**User Benefits**:
- Access to real-time and historical market data
- Reliable data source (Alpha Vantage API)
- Fast data retrieval through caching
- Comprehensive stock information

#### 1.2.7 Educational Content

**Purpose**: Educate users about technical analysis and trading concepts

**Features**:
- **Learn Technical Indicators**: Interactive educational section explaining:
  - How each indicator works (concept and formula)
  - Trading signals generated by each indicator
  - Pro tips for using indicators effectively
- **Interactive Calculator**: Visual calculator demonstrating indicator calculations with sample data
- **Step-by-step Navigation**: Guided tour through different indicators
- **Visual Examples**: Charts and examples showing indicator behavior

**User Benefits**:
- Understanding of technical analysis concepts
- Learning how to interpret trading signals
- Building confidence in using the platform
- Educational resource for trading knowledge

#### 1.2.8 Stock Recommendations

**Purpose**: Provide personalized stock recommendations based on technical analysis

**Features**:
- **Individual Stock Analysis**: Get recommendations for specific stocks
- **Multi-indicator Analysis**: Recommendations based on multiple technical indicators
- **Confidence Scoring**: Confidence levels for each recommendation
- **Reasoning Explanation**: Detailed explanation of why a recommendation is made
- **Strategy-based Recommendations**: Recommendations aligned with selected trading strategy

**User Benefits**:
- Data-driven stock selection
- Understanding of recommendation rationale
- Confidence in trading decisions

#### 1.2.9 Backtesting (Partial Implementation)

**Purpose**: Test trading strategies against historical data

**Features**:
- **API Endpoint**: Backend support for backtesting requests
- **Historical Simulation**: (Planned) Simulate trading strategies using past market data
- **Performance Metrics**: (Planned) Calculate metrics like CAGR, Sharpe ratio, and maximum drawdown

**Status**: Endpoint exists but full simulation engine is not yet implemented

#### 1.2.10 Paper Trading (Partial Implementation)

**Purpose**: Real-time validation of trading strategies

**Features**:
- **API Endpoint**: Backend support for paper trading sessions
- **Real-time Tracking**: (Planned) Track paper trading performance in real-time
- **Performance Comparison**: (Planned) Compare paper trading results with backtested expectations

**Status**: Endpoint exists but real-time validation is not yet fully implemented

#### 1.2.11 System Administration and Security

**Purpose**: Ensure system security and reliability

**Features**:
- **Rate Limiting**: Protection against API abuse (100 requests/15min global, 5 requests/15min for authentication)
- **Security Headers**: Helmet.js for HTTP security headers
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Input Validation**: All user inputs validated before processing
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Logging**: Request logging for debugging and monitoring
- **Database Connection Management**: Graceful handling of database connection issues with in-memory fallback

**User Benefits**:
- Secure platform
- Protection against abuse
- Reliable system operation
- Data integrity

### 1.3 Target Users

The system is designed for:

1. **Individual Investors**: Retail investors managing personal stock portfolios
2. **Trading Learners**: People learning about stock trading and technical analysis
3. **Strategy Testers**: Investors wanting to test trading strategies before using real money
4. **Portfolio Managers**: Users managing multiple portfolios with different strategies

### 1.4 System Capabilities Summary

The Horizon Trading Platform successfully provides:

- ✅ Complete user authentication and account management
- ✅ Real-time stock market data integration
- ✅ Five major technical indicators with signal generation
- ✅ Four trading strategies with automatic recommendations
- ✅ Full portfolio management with position tracking
- ✅ Virtual trading system with transaction history
- ✅ Educational content for learning technical analysis
- ✅ Stock recommendations based on technical analysis
- ✅ Comprehensive transaction and performance tracking
- 🟡 Backtesting framework (partially implemented)
- 🟡 Paper trading validation (partially implemented)

The system demonstrates a production-ready implementation of core trading and portfolio management features, with a solid foundation for future enhancements in backtesting and advanced trading strategies.


