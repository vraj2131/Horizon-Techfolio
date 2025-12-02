# System Architecture - Horizon Trading Platform

## Overview

The Horizon Trading Platform is a full-stack web application built with a Next.js frontend and Express.js backend, using MongoDB for data persistence and Alpha Vantage API for market data.

## Architecture Layers

### 1. Presentation Layer (Frontend)
- **Technology**: Next.js 14+ (React with TypeScript)
- **Location**: `/frontend/`
- **Components**:
  - Pages (app router)
  - UI Components
  - State Management (Zustand)
  - API Client (Axios)

### 2. Application Layer (Backend API)
- **Technology**: Express.js
- **Location**: `/src/api/`
- **Components**:
  - Route Handlers
  - Middleware (Auth, Validation, Error Handling)
  - Request/Response Processing

### 3. Business Logic Layer (Services)
- **Technology**: Node.js
- **Location**: `/src/services/`
- **Components**:
  - Trading Service
  - Indicator Service
  - Strategy Service
  - Market Data Provider
  - Price Data Service
  - Auth Service
  - Daily Update Service

### 4. Domain Model Layer
- **Technology**: JavaScript Classes
- **Location**: `/src/models/`
- **Components**:
  - Portfolio
  - Position
  - Security
  - Strategy
  - TechnicalIndicator
  - User

### 5. Data Access Layer
- **Technology**: Mongoose ODM
- **Location**: `/src/db/`
- **Components**:
  - Database Service (DBService)
  - Database Models
  - Connection Management

### 6. Data Persistence Layer
- **Technology**: MongoDB Atlas
- **Storage**: Cloud-hosted MongoDB database

### 7. External Services
- **Alpha Vantage API**: Market data provider
- **Cron Jobs**: Scheduled tasks for daily updates

## Key Modules

### Frontend Modules

#### 1. **Pages** (`/frontend/app/`)
- `page.tsx` - Landing page
- `dashboard/page.tsx` - User dashboard
- `login/page.tsx` - User authentication
- `register/page.tsx` - User registration
- `trading/page.tsx` - Buy/sell stocks
- `transactions/page.tsx` - Transaction history
- `watchlist/page.tsx` - Stock watchlist
- `stock/[ticker]/page.tsx` - Stock details
- `portfolio/[id]/page.tsx` - Portfolio management
- `learn/page.tsx` - Educational content
- `recommendations/page.tsx` - Stock recommendations
- `backtest/page.tsx` - Backtesting interface
- `paper-trading/page.tsx` - Paper trading interface
- `coupled-trades/page.tsx` - Coupled trades interface

#### 2. **Components** (`/frontend/components/`)
- **UI Components**: Button, Badge, Input, Modal, Loading, GlassCard, Tabs
- **Auth Components**: LoginForm, RegisterForm
- **Trading Components**: Trading forms and displays
- **Portfolio Components**: Portfolio management UI
- **Indicator Components**: Technical indicator displays
- **Stock Components**: Stock detail views

#### 3. **State Management** (`/frontend/lib/store/`)
- `authStore.ts` - Authentication state
- `portfolioStore.ts` - Portfolio state
- `walletStore.ts` - Wallet and trading state

#### 4. **API Client** (`/frontend/lib/api/`)
- `client.ts` - Axios instance with interceptors
- `auth.ts` - Authentication API calls
- `portfolio.ts` - Portfolio API calls
- `stocks.ts` - Stock data API calls
- `trading.ts` - Trading API calls

### Backend Modules

#### 1. **API Routes** (`/src/api/routes/`)
- `index.js` - Main router aggregator
- `portfolio.routes.js` - Portfolio endpoints
- `user.routes.js` - User and auth endpoints
- `stock.routes.js` - Stock data endpoints
- `wallet.routes.js` - Trading and wallet endpoints
- `backtest.routes.js` - Backtesting endpoints
- `papertrading.routes.js` - Paper trading endpoints
- `coupledtrade.routes.js` - Coupled trades endpoints

#### 2. **Middleware** (`/src/api/middleware/`)
- `auth.middleware.js` - JWT authentication
- `validation.middleware.js` - Request validation
- `error.middleware.js` - Error handling

#### 3. **Services** (`/src/services/`)
- **TradingService.js**: Buy/sell operations, wallet management
- **IndicatorService.js**: Technical indicator calculations (SMA, EMA, RSI, MACD, Bollinger)
- **StrategyService.js**: Trading strategy implementations
- **MarketDataProvider.js**: Alpha Vantage API integration
- **PriceDataService.js**: Price data caching and retrieval
- **AuthService.js**: User authentication and JWT management
- **DailyUpdateService.js**: Scheduled price data updates

#### 4. **Domain Models** (`/src/models/`)
- **Portfolio.js**: Portfolio management logic
- **Position.js**: Position tracking and P&L calculation
- **Security.js**: Stock security information
- **Strategy.js**: Trading strategy logic
- **TechnicalIndicator.js**: Indicator base class
- **User.js**: User domain model

#### 5. **Database Layer** (`/src/db/`)
- **connection.js**: MongoDB connection management
- **dbService.js**: Database abstraction layer
- **models/**: Mongoose schemas
  - UserModel.js
  - WalletModel.js
  - PortfolioModel.js
  - TransactionModel.js
  - PriceDataModel.js
  - BacktestSessionModel.js
  - PaperTradingSessionModel.js

#### 6. **Utilities** (`/src/utils/`)
- `calculations.js` - Mathematical utilities
- `validators.js` - Data validation functions

## Data Flow

### 1. User Authentication Flow
```
User → Frontend (Login Form) 
  → API Client (POST /auth/login)
  → Backend (Auth Middleware)
  → AuthService (Validate credentials)
  → Database (UserModel)
  → JWT Token Generation
  → Frontend (Store token, update auth state)
```

### 2. Stock Trading Flow
```
User → Frontend (Trading Form)
  → API Client (POST /wallet/buy or /wallet/sell)
  → Backend (Auth + Validation Middleware)
  → TradingService (Process trade)
  → MarketDataProvider (Get current price)
  → WalletModel (Update balance)
  → TransactionModel (Create transaction record)
  → PortfolioModel (Update positions if portfolio linked)
  → Response → Frontend (Update UI)
```

### 3. Portfolio Management Flow
```
User → Frontend (Create Portfolio)
  → API Client (POST /portfolio/initialize)
  → Backend (Validation)
  → Portfolio Service
  → Security Model (Validate tickers)
  → MarketDataProvider (Fetch initial data)
  → PortfolioModel (Save to database)
  → Response → Frontend (Display portfolio)
```

### 4. Technical Indicator Calculation Flow
```
User → Frontend (View Stock Details)
  → API Client (GET /stocks/:ticker/indicators)
  → Backend (Stock Routes)
  → PriceDataService (Get historical data)
  → IndicatorService (Calculate indicators)
  → Response → Frontend (Display indicators)
```

### 5. Daily Price Update Flow
```
Cron Job → DailyUpdateService
  → PriceDataService (Check which tickers need update)
  → MarketDataProvider (Fetch latest prices from Alpha Vantage)
  → PriceDataModel (Update database)
  → Cache (Update local cache)
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator

### Database
- **Database**: MongoDB Atlas (Cloud)
- **ODM**: Mongoose
- **Connection**: Mongoose connection pooling

### External Services
- **Market Data**: Alpha Vantage API
- **Scheduling**: Node-cron (for daily updates)

### Infrastructure
- **Security**: Helmet.js
- **CORS**: cors middleware
- **Logging**: Morgan
- **Compression**: compression middleware
- **Rate Limiting**: express-rate-limit

## Security Architecture

1. **Authentication**: JWT tokens stored in HTTP-only cookies
2. **Authorization**: Middleware checks JWT on protected routes
3. **Password Security**: bcrypt hashing with salt rounds
4. **API Security**: Helmet.js for HTTP headers
5. **Rate Limiting**: Prevents abuse (100 req/15min global, 5 req/15min auth)
6. **Input Validation**: express-validator on all inputs
7. **CORS**: Configurable cross-origin resource sharing

## Caching Strategy

1. **Price Data Cache**: Local file system cache (`/cache/`)
2. **Database Cache**: MongoDB stores historical data
3. **API Response Cache**: Aggressive caching to minimize Alpha Vantage calls
4. **Frontend Cache**: Zustand stores with TTL for API responses

## Error Handling

1. **Frontend**: Try-catch blocks, error boundaries, toast notifications
2. **Backend**: Centralized error middleware
3. **API**: Standardized error response format
4. **Database**: Connection error handling with fallback to in-memory mode

## Deployment Architecture

### Development
- Frontend: `localhost:3001` (Next.js dev server)
- Backend: `localhost:3000` (Express.js)
- Database: MongoDB Atlas (cloud)

### Production (Recommended)
- Frontend: Vercel/Netlify (Next.js)
- Backend: Heroku/AWS/DigitalOcean (Node.js)
- Database: MongoDB Atlas (cloud)
- Environment Variables: Managed via platform

## Module Dependencies

```
Frontend (Next.js)
  ├── API Client (Axios)
  │   └── Backend API (Express.js)
  │       ├── Routes
  │       ├── Middleware
  │       └── Services
  │           ├── TradingService
  │           ├── IndicatorService
  │           ├── StrategyService
  │           ├── MarketDataProvider
  │           │   └── Alpha Vantage API
  │           ├── PriceDataService
  │           │   └── MongoDB (PriceData)
  │           └── AuthService
  │               └── MongoDB (User)
  └── State Management (Zustand)
      └── API Client

Backend (Express.js)
  ├── Services
  │   └── Database Service (DBService)
  │       └── MongoDB (Mongoose)
  │           ├── UserModel
  │           ├── WalletModel
  │           ├── PortfolioModel
  │           ├── TransactionModel
  │           ├── PriceDataModel
  │           ├── BacktestSessionModel
  │           └── PaperTradingSessionModel
  └── Background Services
      └── DailyUpdateService
          └── Cron Job
```

## Key Design Patterns

1. **MVC Pattern**: Models (domain), Views (frontend), Controllers (routes)
2. **Service Layer Pattern**: Business logic separated from routes
3. **Repository Pattern**: DBService abstracts database operations
4. **Middleware Pattern**: Request processing pipeline
5. **Singleton Pattern**: Service instances (MarketDataProvider, etc.)
6. **Factory Pattern**: Model creation (Portfolio, Position, etc.)




## Overview

The Horizon Trading Platform is a full-stack web application built with a Next.js frontend and Express.js backend, using MongoDB for data persistence and Alpha Vantage API for market data.

## Architecture Layers

### 1. Presentation Layer (Frontend)
- **Technology**: Next.js 14+ (React with TypeScript)
- **Location**: `/frontend/`
- **Components**:
  - Pages (app router)
  - UI Components
  - State Management (Zustand)
  - API Client (Axios)

### 2. Application Layer (Backend API)
- **Technology**: Express.js
- **Location**: `/src/api/`
- **Components**:
  - Route Handlers
  - Middleware (Auth, Validation, Error Handling)
  - Request/Response Processing

### 3. Business Logic Layer (Services)
- **Technology**: Node.js
- **Location**: `/src/services/`
- **Components**:
  - Trading Service
  - Indicator Service
  - Strategy Service
  - Market Data Provider
  - Price Data Service
  - Auth Service
  - Daily Update Service

### 4. Domain Model Layer
- **Technology**: JavaScript Classes
- **Location**: `/src/models/`
- **Components**:
  - Portfolio
  - Position
  - Security
  - Strategy
  - TechnicalIndicator
  - User

### 5. Data Access Layer
- **Technology**: Mongoose ODM
- **Location**: `/src/db/`
- **Components**:
  - Database Service (DBService)
  - Database Models
  - Connection Management

### 6. Data Persistence Layer
- **Technology**: MongoDB Atlas
- **Storage**: Cloud-hosted MongoDB database

### 7. External Services
- **Alpha Vantage API**: Market data provider
- **Cron Jobs**: Scheduled tasks for daily updates

## Key Modules

### Frontend Modules

#### 1. **Pages** (`/frontend/app/`)
- `page.tsx` - Landing page
- `dashboard/page.tsx` - User dashboard
- `login/page.tsx` - User authentication
- `register/page.tsx` - User registration
- `trading/page.tsx` - Buy/sell stocks
- `transactions/page.tsx` - Transaction history
- `watchlist/page.tsx` - Stock watchlist
- `stock/[ticker]/page.tsx` - Stock details
- `portfolio/[id]/page.tsx` - Portfolio management
- `learn/page.tsx` - Educational content
- `recommendations/page.tsx` - Stock recommendations
- `backtest/page.tsx` - Backtesting interface
- `paper-trading/page.tsx` - Paper trading interface
- `coupled-trades/page.tsx` - Coupled trades interface

#### 2. **Components** (`/frontend/components/`)
- **UI Components**: Button, Badge, Input, Modal, Loading, GlassCard, Tabs
- **Auth Components**: LoginForm, RegisterForm
- **Trading Components**: Trading forms and displays
- **Portfolio Components**: Portfolio management UI
- **Indicator Components**: Technical indicator displays
- **Stock Components**: Stock detail views

#### 3. **State Management** (`/frontend/lib/store/`)
- `authStore.ts` - Authentication state
- `portfolioStore.ts` - Portfolio state
- `walletStore.ts` - Wallet and trading state

#### 4. **API Client** (`/frontend/lib/api/`)
- `client.ts` - Axios instance with interceptors
- `auth.ts` - Authentication API calls
- `portfolio.ts` - Portfolio API calls
- `stocks.ts` - Stock data API calls
- `trading.ts` - Trading API calls

### Backend Modules

#### 1. **API Routes** (`/src/api/routes/`)
- `index.js` - Main router aggregator
- `portfolio.routes.js` - Portfolio endpoints
- `user.routes.js` - User and auth endpoints
- `stock.routes.js` - Stock data endpoints
- `wallet.routes.js` - Trading and wallet endpoints
- `backtest.routes.js` - Backtesting endpoints
- `papertrading.routes.js` - Paper trading endpoints
- `coupledtrade.routes.js` - Coupled trades endpoints

#### 2. **Middleware** (`/src/api/middleware/`)
- `auth.middleware.js` - JWT authentication
- `validation.middleware.js` - Request validation
- `error.middleware.js` - Error handling

#### 3. **Services** (`/src/services/`)
- **TradingService.js**: Buy/sell operations, wallet management
- **IndicatorService.js**: Technical indicator calculations (SMA, EMA, RSI, MACD, Bollinger)
- **StrategyService.js**: Trading strategy implementations
- **MarketDataProvider.js**: Alpha Vantage API integration
- **PriceDataService.js**: Price data caching and retrieval
- **AuthService.js**: User authentication and JWT management
- **DailyUpdateService.js**: Scheduled price data updates

#### 4. **Domain Models** (`/src/models/`)
- **Portfolio.js**: Portfolio management logic
- **Position.js**: Position tracking and P&L calculation
- **Security.js**: Stock security information
- **Strategy.js**: Trading strategy logic
- **TechnicalIndicator.js**: Indicator base class
- **User.js**: User domain model

#### 5. **Database Layer** (`/src/db/`)
- **connection.js**: MongoDB connection management
- **dbService.js**: Database abstraction layer
- **models/**: Mongoose schemas
  - UserModel.js
  - WalletModel.js
  - PortfolioModel.js
  - TransactionModel.js
  - PriceDataModel.js
  - BacktestSessionModel.js
  - PaperTradingSessionModel.js

#### 6. **Utilities** (`/src/utils/`)
- `calculations.js` - Mathematical utilities
- `validators.js` - Data validation functions

## Data Flow

### 1. User Authentication Flow
```
User → Frontend (Login Form) 
  → API Client (POST /auth/login)
  → Backend (Auth Middleware)
  → AuthService (Validate credentials)
  → Database (UserModel)
  → JWT Token Generation
  → Frontend (Store token, update auth state)
```

### 2. Stock Trading Flow
```
User → Frontend (Trading Form)
  → API Client (POST /wallet/buy or /wallet/sell)
  → Backend (Auth + Validation Middleware)
  → TradingService (Process trade)
  → MarketDataProvider (Get current price)
  → WalletModel (Update balance)
  → TransactionModel (Create transaction record)
  → PortfolioModel (Update positions if portfolio linked)
  → Response → Frontend (Update UI)
```

### 3. Portfolio Management Flow
```
User → Frontend (Create Portfolio)
  → API Client (POST /portfolio/initialize)
  → Backend (Validation)
  → Portfolio Service
  → Security Model (Validate tickers)
  → MarketDataProvider (Fetch initial data)
  → PortfolioModel (Save to database)
  → Response → Frontend (Display portfolio)
```

### 4. Technical Indicator Calculation Flow
```
User → Frontend (View Stock Details)
  → API Client (GET /stocks/:ticker/indicators)
  → Backend (Stock Routes)
  → PriceDataService (Get historical data)
  → IndicatorService (Calculate indicators)
  → Response → Frontend (Display indicators)
```

### 5. Daily Price Update Flow
```
Cron Job → DailyUpdateService
  → PriceDataService (Check which tickers need update)
  → MarketDataProvider (Fetch latest prices from Alpha Vantage)
  → PriceDataModel (Update database)
  → Cache (Update local cache)
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator

### Database
- **Database**: MongoDB Atlas (Cloud)
- **ODM**: Mongoose
- **Connection**: Mongoose connection pooling

### External Services
- **Market Data**: Alpha Vantage API
- **Scheduling**: Node-cron (for daily updates)

### Infrastructure
- **Security**: Helmet.js
- **CORS**: cors middleware
- **Logging**: Morgan
- **Compression**: compression middleware
- **Rate Limiting**: express-rate-limit

## Security Architecture

1. **Authentication**: JWT tokens stored in HTTP-only cookies
2. **Authorization**: Middleware checks JWT on protected routes
3. **Password Security**: bcrypt hashing with salt rounds
4. **API Security**: Helmet.js for HTTP headers
5. **Rate Limiting**: Prevents abuse (100 req/15min global, 5 req/15min auth)
6. **Input Validation**: express-validator on all inputs
7. **CORS**: Configurable cross-origin resource sharing

## Caching Strategy

1. **Price Data Cache**: Local file system cache (`/cache/`)
2. **Database Cache**: MongoDB stores historical data
3. **API Response Cache**: Aggressive caching to minimize Alpha Vantage calls
4. **Frontend Cache**: Zustand stores with TTL for API responses

## Error Handling

1. **Frontend**: Try-catch blocks, error boundaries, toast notifications
2. **Backend**: Centralized error middleware
3. **API**: Standardized error response format
4. **Database**: Connection error handling with fallback to in-memory mode

## Deployment Architecture

### Development
- Frontend: `localhost:3001` (Next.js dev server)
- Backend: `localhost:3000` (Express.js)
- Database: MongoDB Atlas (cloud)

### Production (Recommended)
- Frontend: Vercel/Netlify (Next.js)
- Backend: Heroku/AWS/DigitalOcean (Node.js)
- Database: MongoDB Atlas (cloud)
- Environment Variables: Managed via platform

## Module Dependencies

```
Frontend (Next.js)
  ├── API Client (Axios)
  │   └── Backend API (Express.js)
  │       ├── Routes
  │       ├── Middleware
  │       └── Services
  │           ├── TradingService
  │           ├── IndicatorService
  │           ├── StrategyService
  │           ├── MarketDataProvider
  │           │   └── Alpha Vantage API
  │           ├── PriceDataService
  │           │   └── MongoDB (PriceData)
  │           └── AuthService
  │               └── MongoDB (User)
  └── State Management (Zustand)
      └── API Client

Backend (Express.js)
  ├── Services
  │   └── Database Service (DBService)
  │       └── MongoDB (Mongoose)
  │           ├── UserModel
  │           ├── WalletModel
  │           ├── PortfolioModel
  │           ├── TransactionModel
  │           ├── PriceDataModel
  │           ├── BacktestSessionModel
  │           └── PaperTradingSessionModel
  └── Background Services
      └── DailyUpdateService
          └── Cron Job
```

## Key Design Patterns

1. **MVC Pattern**: Models (domain), Views (frontend), Controllers (routes)
2. **Service Layer Pattern**: Business logic separated from routes
3. **Repository Pattern**: DBService abstracts database operations
4. **Middleware Pattern**: Request processing pipeline
5. **Singleton Pattern**: Service instances (MarketDataProvider, etc.)
6. **Factory Pattern**: Model creation (Portfolio, Position, etc.)


