# Entity-Relationship Diagram for Horizon Trading Platform

## Database Entities and Relationships

### Entities

#### 1. User
- **Primary Key**: userId (String, unique)
- **Attributes**:
  - name (String, required)
  - email (String, optional)
  - passwordHash (String, optional)
  - createdAt (Date)

#### 2. Wallet
- **Primary Key**: _id (MongoDB ObjectId)
- **Foreign Key**: userId (String, unique, references User)
- **Attributes**:
  - balance (Number, default: 10000)
  - currency (String, default: 'USD')
  - reservedFunds (Number, default: 0)
  - totalDeposited (Number, default: 10000)
  - totalInvested (Number, default: 0)
  - totalWithdrawn (Number, default: 0)
  - totalProfitLoss (Number, default: 0)
  - totalTrades (Number, default: 0)
  - winningTrades (Number, default: 0)
  - losingTrades (Number, default: 0)
  - status (String: 'active', 'frozen', 'closed')
  - lastTransactionAt (Date, optional)
  - createdAt (Date)
  - updatedAt (Date)

#### 3. Portfolio
- **Primary Key**: portfolioId (String, unique)
- **Foreign Key**: userId (String, references User)
- **Attributes**:
  - name (String, optional)
  - horizon (Number: 1, 2, or 5)
  - cash (Number, default: 100000)
  - initialCapital (Number, optional)
  - risk_budget (Number, default: 1.0)
  - securities (Array of Security objects)
  - positions (Array of Position objects)
  - createdAt (Date)
  - lastUpdated (Date)

**Embedded Objects**:
- **Security** (embedded in Portfolio):
  - ticker (String)
  - name (String)
  - exchange (String)
  - sector (String)
  - inception_date (String)

- **Position** (embedded in Portfolio):
  - ticker (String)
  - side (String: 'long', 'short')
  - quantity (Number)
  - averageCost (Number)
  - currentPrice (Number)
  - marketValue (Number)
  - profitLoss (Number)
  - profitLossPercent (Number)

#### 4. Transaction
- **Primary Key**: _id (MongoDB ObjectId)
- **Foreign Keys**: 
  - userId (String, references User)
  - portfolioId (String, optional, references Portfolio)
- **Attributes**:
  - type (String: 'buy', 'sell', 'deposit', 'withdrawal', 'dividend', 'fee', 'commission')
  - ticker (String, required for buy/sell)
  - quantity (Number, required for buy/sell)
  - price (Number, required for buy/sell)
  - subtotal (Number)
  - commission (Number, default: 0)
  - fees (Number, default: 0)
  - total (Number)
  - balanceBefore (Number)
  - balanceAfter (Number)
  - status (String: 'pending', 'completed', 'failed', 'cancelled')
  - executionType (String: 'market', 'limit', 'stop', 'stop-limit')
  - orderSource (String: 'manual', 'strategy', 'auto-rebalance', 'coupled-trade')
  - costBasis (Number, optional, for sell transactions)
  - realizedProfitLoss (Number, optional, for sell transactions)
  - notes (String)
  - errorMessage (String, optional)
  - createdAt (Date)
  - updatedAt (Date)

#### 5. PriceData
- **Primary Key**: _id (MongoDB ObjectId)
- **Unique Key**: ticker (String, unique)
- **Attributes**:
  - interval (String, default: 'daily')
  - data (Array of PricePoint objects)
  - firstDate (String)
  - lastDate (String)
  - lastUpdated (Date)
  - totalDataPoints (Number)

**Embedded Objects**:
- **PricePoint** (embedded in PriceData):
  - date (String)
  - open (Number)
  - high (Number)
  - low (Number)
  - close (Number)
  - volume (Number)

#### 6. BacktestSession
- **Primary Key**: sessionId (String, unique)
- **Foreign Key**: portfolioId (String, references Portfolio)
- **Attributes**:
  - startDate (String)
  - endDate (String)
  - strategy (String)
  - status (String: 'running', 'completed', 'failed')
  - metrics (Object):
    - cagr (Number)
    - sharpe (Number)
    - maxDrawdown (Number)
    - totalReturn (Number)
    - winRate (Number)
    - totalTrades (Number)
  - createdAt (Date)
  - completedAt (Date, optional)

#### 7. PaperTradingSession
- **Primary Key**: _id (MongoDB ObjectId)
- **Unique Key**: portfolioId (String, unique, references Portfolio)
- **Attributes**:
  - status (String: 'active', 'paused', 'stopped')
  - initialValue (Number, default: 100000)
  - currentValue (Number, default: 100000)
  - totalReturn (Number, default: 0)
  - dailyReturn (Number, default: 0)
  - paperTrades (Array of PaperTrade objects)
  - performance (Object):
    - currentValue (Number)
    - totalReturn (Number)
    - dailyReturn (Number)
    - sharpeRatio (Number)
    - maxDrawdown (Number)
  - startedAt (Date)
  - lastUpdated (Date)

**Embedded Objects**:
- **PaperTrade** (embedded in PaperTradingSession):
  - ticker (String)
  - side (String: 'buy', 'sell')
  - shares (Number)
  - price (Number)
  - timestamp (Date)

## Relationships

1. **User → Wallet**: One-to-One (1:1)
   - Each user has exactly one wallet
   - Relationship: userId (unique in Wallet)

2. **User → Portfolio**: One-to-Many (1:N)
   - Each user can have multiple portfolios
   - Relationship: userId in Portfolio

3. **User → Transaction**: One-to-Many (1:N)
   - Each user can have many transactions
   - Relationship: userId in Transaction

4. **Portfolio → Transaction**: One-to-Many (1:N)
   - Each portfolio can have many transactions (optional)
   - Relationship: portfolioId in Transaction (optional)

5. **Portfolio → BacktestSession**: One-to-Many (1:N)
   - Each portfolio can have multiple backtest sessions
   - Relationship: portfolioId in BacktestSession

6. **Portfolio → PaperTradingSession**: One-to-One (1:1)
   - Each portfolio can have one paper trading session
   - Relationship: portfolioId (unique in PaperTradingSession)

7. **PriceData**: Standalone entity
   - Referenced by ticker (not a foreign key relationship, but logical reference)
   - Used by Portfolio positions and Transaction tickers

## Data Sources

### Historical Market Data
- **Source**: Alpha Vantage API
- **Endpoint**: TIME_SERIES_DAILY
- **Storage**: MongoDB PriceData collection
- **Coverage**: 10 years of historical data for 20 stocks
- **Update Frequency**: Daily (via cron job)
- **Rate Limits**: 5 calls/minute, 500 calls/day (free tier)

### Real-Time Market Data
- **Source**: Alpha Vantage API
- **Endpoint**: GLOBAL_QUOTE
- **Usage**: Fetched on-demand for current stock prices
- **Caching**: Aggressive caching to minimize API calls
- **Rate Limits**: Same as historical data

## Indexes

### User
- userId (unique)
- email
- createdAt (descending)

### Wallet
- userId (unique)
- userId + status (compound)

### Portfolio
- portfolioId (unique)
- userId
- createdAt (descending)

### Transaction
- userId + createdAt (compound, descending)
- userId + ticker + type (compound)
- portfolioId + createdAt (compound, descending)
- ticker + type + createdAt (compound, descending)

### PriceData
- ticker (unique)
- lastDate (descending)
- lastUpdated (descending)

### BacktestSession
- sessionId (unique)
- portfolioId
- createdAt (descending)

### PaperTradingSession
- portfolioId (unique)
- status
- startedAt (descending)




## Database Entities and Relationships

### Entities

#### 1. User
- **Primary Key**: userId (String, unique)
- **Attributes**:
  - name (String, required)
  - email (String, optional)
  - passwordHash (String, optional)
  - createdAt (Date)

#### 2. Wallet
- **Primary Key**: _id (MongoDB ObjectId)
- **Foreign Key**: userId (String, unique, references User)
- **Attributes**:
  - balance (Number, default: 10000)
  - currency (String, default: 'USD')
  - reservedFunds (Number, default: 0)
  - totalDeposited (Number, default: 10000)
  - totalInvested (Number, default: 0)
  - totalWithdrawn (Number, default: 0)
  - totalProfitLoss (Number, default: 0)
  - totalTrades (Number, default: 0)
  - winningTrades (Number, default: 0)
  - losingTrades (Number, default: 0)
  - status (String: 'active', 'frozen', 'closed')
  - lastTransactionAt (Date, optional)
  - createdAt (Date)
  - updatedAt (Date)

#### 3. Portfolio
- **Primary Key**: portfolioId (String, unique)
- **Foreign Key**: userId (String, references User)
- **Attributes**:
  - name (String, optional)
  - horizon (Number: 1, 2, or 5)
  - cash (Number, default: 100000)
  - initialCapital (Number, optional)
  - risk_budget (Number, default: 1.0)
  - securities (Array of Security objects)
  - positions (Array of Position objects)
  - createdAt (Date)
  - lastUpdated (Date)

**Embedded Objects**:
- **Security** (embedded in Portfolio):
  - ticker (String)
  - name (String)
  - exchange (String)
  - sector (String)
  - inception_date (String)

- **Position** (embedded in Portfolio):
  - ticker (String)
  - side (String: 'long', 'short')
  - quantity (Number)
  - averageCost (Number)
  - currentPrice (Number)
  - marketValue (Number)
  - profitLoss (Number)
  - profitLossPercent (Number)

#### 4. Transaction
- **Primary Key**: _id (MongoDB ObjectId)
- **Foreign Keys**: 
  - userId (String, references User)
  - portfolioId (String, optional, references Portfolio)
- **Attributes**:
  - type (String: 'buy', 'sell', 'deposit', 'withdrawal', 'dividend', 'fee', 'commission')
  - ticker (String, required for buy/sell)
  - quantity (Number, required for buy/sell)
  - price (Number, required for buy/sell)
  - subtotal (Number)
  - commission (Number, default: 0)
  - fees (Number, default: 0)
  - total (Number)
  - balanceBefore (Number)
  - balanceAfter (Number)
  - status (String: 'pending', 'completed', 'failed', 'cancelled')
  - executionType (String: 'market', 'limit', 'stop', 'stop-limit')
  - orderSource (String: 'manual', 'strategy', 'auto-rebalance', 'coupled-trade')
  - costBasis (Number, optional, for sell transactions)
  - realizedProfitLoss (Number, optional, for sell transactions)
  - notes (String)
  - errorMessage (String, optional)
  - createdAt (Date)
  - updatedAt (Date)

#### 5. PriceData
- **Primary Key**: _id (MongoDB ObjectId)
- **Unique Key**: ticker (String, unique)
- **Attributes**:
  - interval (String, default: 'daily')
  - data (Array of PricePoint objects)
  - firstDate (String)
  - lastDate (String)
  - lastUpdated (Date)
  - totalDataPoints (Number)

**Embedded Objects**:
- **PricePoint** (embedded in PriceData):
  - date (String)
  - open (Number)
  - high (Number)
  - low (Number)
  - close (Number)
  - volume (Number)

#### 6. BacktestSession
- **Primary Key**: sessionId (String, unique)
- **Foreign Key**: portfolioId (String, references Portfolio)
- **Attributes**:
  - startDate (String)
  - endDate (String)
  - strategy (String)
  - status (String: 'running', 'completed', 'failed')
  - metrics (Object):
    - cagr (Number)
    - sharpe (Number)
    - maxDrawdown (Number)
    - totalReturn (Number)
    - winRate (Number)
    - totalTrades (Number)
  - createdAt (Date)
  - completedAt (Date, optional)

#### 7. PaperTradingSession
- **Primary Key**: _id (MongoDB ObjectId)
- **Unique Key**: portfolioId (String, unique, references Portfolio)
- **Attributes**:
  - status (String: 'active', 'paused', 'stopped')
  - initialValue (Number, default: 100000)
  - currentValue (Number, default: 100000)
  - totalReturn (Number, default: 0)
  - dailyReturn (Number, default: 0)
  - paperTrades (Array of PaperTrade objects)
  - performance (Object):
    - currentValue (Number)
    - totalReturn (Number)
    - dailyReturn (Number)
    - sharpeRatio (Number)
    - maxDrawdown (Number)
  - startedAt (Date)
  - lastUpdated (Date)

**Embedded Objects**:
- **PaperTrade** (embedded in PaperTradingSession):
  - ticker (String)
  - side (String: 'buy', 'sell')
  - shares (Number)
  - price (Number)
  - timestamp (Date)

## Relationships

1. **User → Wallet**: One-to-One (1:1)
   - Each user has exactly one wallet
   - Relationship: userId (unique in Wallet)

2. **User → Portfolio**: One-to-Many (1:N)
   - Each user can have multiple portfolios
   - Relationship: userId in Portfolio

3. **User → Transaction**: One-to-Many (1:N)
   - Each user can have many transactions
   - Relationship: userId in Transaction

4. **Portfolio → Transaction**: One-to-Many (1:N)
   - Each portfolio can have many transactions (optional)
   - Relationship: portfolioId in Transaction (optional)

5. **Portfolio → BacktestSession**: One-to-Many (1:N)
   - Each portfolio can have multiple backtest sessions
   - Relationship: portfolioId in BacktestSession

6. **Portfolio → PaperTradingSession**: One-to-One (1:1)
   - Each portfolio can have one paper trading session
   - Relationship: portfolioId (unique in PaperTradingSession)

7. **PriceData**: Standalone entity
   - Referenced by ticker (not a foreign key relationship, but logical reference)
   - Used by Portfolio positions and Transaction tickers

## Data Sources

### Historical Market Data
- **Source**: Alpha Vantage API
- **Endpoint**: TIME_SERIES_DAILY
- **Storage**: MongoDB PriceData collection
- **Coverage**: 10 years of historical data for 20 stocks
- **Update Frequency**: Daily (via cron job)
- **Rate Limits**: 5 calls/minute, 500 calls/day (free tier)

### Real-Time Market Data
- **Source**: Alpha Vantage API
- **Endpoint**: GLOBAL_QUOTE
- **Usage**: Fetched on-demand for current stock prices
- **Caching**: Aggressive caching to minimize API calls
- **Rate Limits**: Same as historical data

## Indexes

### User
- userId (unique)
- email
- createdAt (descending)

### Wallet
- userId (unique)
- userId + status (compound)

### Portfolio
- portfolioId (unique)
- userId
- createdAt (descending)

### Transaction
- userId + createdAt (compound, descending)
- userId + ticker + type (compound)
- portfolioId + createdAt (compound, descending)
- ticker + type + createdAt (compound, descending)

### PriceData
- ticker (unique)
- lastDate (descending)
- lastUpdated (descending)

### BacktestSession
- sessionId (unique)
- portfolioId
- createdAt (descending)

### PaperTradingSession
- portfolioId (unique)
- status
- startedAt (descending)


