# System Architecture Diagram Creation Guide

## How to Create the Visual Architecture Diagram

### Option 1: Using draw.io (Recommended)

1. Go to [https://app.diagrams.net/](https://app.diagrams.net/)
2. Create a new diagram
3. Select "Blank Diagram" or "Software Architecture"

#### Step-by-Step Instructions:

##### Step 1: Create Layers (Use Containers/Rectangles)

Create 7 main layers from top to bottom:

1. **Presentation Layer** (Top)
2. **Application Layer**
3. **Business Logic Layer**
4. **Domain Model Layer**
5. **Data Access Layer**
6. **Data Persistence Layer**
7. **External Services** (Side or bottom)

##### Step 2: Add Components to Each Layer

**Presentation Layer:**
- Add 3 boxes:
  - "Pages (App Router)" - List: Dashboard, Trading, Portfolio, Transactions, Watchlist, Stock Details, Learn, Recommendations
  - "Components" - List: UI Components, Trading Forms, Portfolio UI, Indicators, Stock Views
  - "State Management (Zustand)" - List: authStore, portfolioStore, walletStore
- Add 1 box below:
  - "API Client (Axios)" - List: auth.ts, portfolio.ts, stocks.ts, trading.ts

**Application Layer:**
- Add 1 box for "Middleware Stack":
  - Helmet (Security)
  - CORS
  - Morgan (Logging)
  - Rate Limit
  - Auth Middleware
  - Validation Middleware
  - Error Middleware
- Add 1 box for "API Routes":
  - /portfolio/*
  - /user/*, /auth/*
  - /stocks/*
  - /wallet/*
  - /backtest/*
  - /paper-trading/*
  - /coupled-trade/*

**Business Logic Layer:**
- Add boxes for services:
  - "TradingService" - buyStock(), sellStock(), getWallet(), getHoldings()
  - "IndicatorService" - SMA, EMA, RSI, MACD, Bollinger Bands
  - "StrategyService" - TrendFollowing, MeanReversion, Momentum, Conservative
  - "MarketDataProvider" - getPrices(), getQuote(), Rate limiting
  - "PriceDataService" - getPriceData(), cacheData(), updateData()
  - "AuthService" - login(), register(), verifyToken()
  - "DailyUpdateService" - Scheduled price updates, Cron job

**Domain Model Layer:**
- Add boxes for models:
  - "Portfolio" - cash, horizon, rebalance()
  - "Position" - quantity, avgCost, P&L
  - "Security" - ticker, name, validate()
  - "Strategy" - name, rules, signals
  - "TechnicalIndicator" - compute(), signal()
  - "User" - userId, name, email

**Data Access Layer:**
- Add 1 box:
  - "DBService" - Abstraction layer with in-memory fallback
  - Methods: savePortfolio(), getUserPortfolios(), saveTransaction(), etc.

**Data Persistence Layer:**
- Add boxes for database models:
  - "UserModel"
  - "WalletModel"
  - "PortfolioModel"
  - "TransactionModel"
  - "PriceDataModel"
  - "BacktestSessionModel"
  - "PaperTradingSessionModel"
- Label as "MongoDB Atlas"

**External Services:**
- Add 1 box:
  - "Alpha Vantage API"
  - TIME_SERIES_DAILY, GLOBAL_QUOTE
  - Rate Limits: 5 calls/min, 500 calls/day
- Add 1 box:
  - "Cron Job Service"
  - Daily Updates

##### Step 3: Add Connections (Arrows)

Draw arrows showing data flow:

1. **Frontend to Backend:**
   - API Client → Application Layer (HTTP/REST API)

2. **Backend Internal:**
   - Routes → Services (multiple connections)
   - Services → Domain Models
   - Services → DBService
   - DBService → MongoDB Models

3. **External Connections:**
   - MarketDataProvider → Alpha Vantage API
   - DailyUpdateService → Alpha Vantage API
   - DailyUpdateService → Cron Job Service

4. **Data Flow:**
   - Use different arrow styles or colors for:
     - Request flow (solid arrows)
     - Response flow (dashed arrows)
     - Background processes (dotted arrows)

##### Step 4: Add Labels and Annotations

- Label each layer clearly
- Add technology stack labels:
  - Frontend: "Next.js, React, TypeScript"
  - Backend: "Express.js, Node.js"
  - Database: "MongoDB Atlas, Mongoose"
- Add protocol labels on connections:
  - "HTTP/REST API" between Frontend and Backend
  - "Mongoose ODM" between Services and Database

### Option 2: Using Lucidchart

1. Go to [https://www.lucidchart.com/](https://www.lucidchart.com/)
2. Select "Software Architecture" template
3. Follow similar steps as draw.io
4. Use Lucidchart's software architecture shapes

### Option 3: Using Mermaid (Text-Based)

For a quick text-based diagram, use Mermaid syntax:

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js)"]
        Pages["Pages<br/>Dashboard, Trading, Portfolio"]
        Components["Components<br/>UI, Forms, Views"]
        State["State Management<br/>Zustand Stores"]
        APIClient["API Client<br/>Axios"]
    end
    
    subgraph Backend["Backend (Express.js)"]
        Middleware["Middleware Stack<br/>Auth, Validation, Error"]
        Routes["API Routes<br/>/portfolio, /wallet, /stocks"]
    end
    
    subgraph Services["Business Logic Layer"]
        TradingSvc["TradingService"]
        IndicatorSvc["IndicatorService"]
        StrategySvc["StrategyService"]
        MarketData["MarketDataProvider"]
        PriceData["PriceDataService"]
        AuthSvc["AuthService"]
        DailyUpdate["DailyUpdateService"]
    end
    
    subgraph Models["Domain Models"]
        Portfolio["Portfolio"]
        Position["Position"]
        Security["Security"]
        Strategy["Strategy"]
    end
    
    subgraph Database["Data Access & Persistence"]
        DBService["DBService"]
        MongoDB["MongoDB Atlas<br/>User, Wallet, Portfolio,<br/>Transaction, PriceData"]
    end
    
    subgraph External["External Services"]
        AlphaVantage["Alpha Vantage API"]
        Cron["Cron Job Service"]
    end
    
    Pages --> APIClient
    Components --> APIClient
    State --> APIClient
    APIClient -->|HTTP/REST| Routes
    Routes --> Middleware
    Middleware --> TradingSvc
    Middleware --> IndicatorSvc
    Middleware --> StrategySvc
    Middleware --> AuthSvc
    TradingSvc --> MarketData
    TradingSvc --> Portfolio
    IndicatorSvc --> PriceData
    StrategySvc --> Strategy
    MarketData --> AlphaVantage
    PriceData --> DBService
    AuthSvc --> DBService
    TradingSvc --> DBService
    DailyUpdate --> MarketData
    DailyUpdate --> Cron
    DBService --> MongoDB
    TradingSvc --> Position
    TradingSvc --> Security
```

### Option 4: Using PlantUML

For a more detailed UML-style diagram:

```plantuml
@startuml
!define RECTANGLE class

package "Frontend Layer" {
  [Pages] as Pages
  [Components] as Components
  [State Management] as State
  [API Client] as APIClient
}

package "Application Layer" {
  [Middleware Stack] as Middleware
  [API Routes] as Routes
}

package "Business Logic Layer" {
  [TradingService] as TradingSvc
  [IndicatorService] as IndicatorSvc
  [StrategyService] as StrategySvc
  [MarketDataProvider] as MarketData
  [PriceDataService] as PriceData
  [AuthService] as AuthSvc
  [DailyUpdateService] as DailyUpdate
}

package "Domain Model Layer" {
  [Portfolio] as Portfolio
  [Position] as Position
  [Security] as Security
  [Strategy] as Strategy
}

package "Data Access Layer" {
  [DBService] as DBService
}

database "MongoDB Atlas" {
  [UserModel] as UserModel
  [WalletModel] as WalletModel
  [PortfolioModel] as PortfolioModel
  [TransactionModel] as TransactionModel
  [PriceDataModel] as PriceDataModel
}

cloud "External Services" {
  [Alpha Vantage API] as AlphaVantage
  [Cron Job] as Cron
}

Pages --> APIClient
Components --> APIClient
State --> APIClient
APIClient --> Routes : HTTP/REST
Routes --> Middleware
Middleware --> TradingSvc
Middleware --> IndicatorSvc
Middleware --> StrategySvc
Middleware --> AuthSvc
TradingSvc --> MarketData
TradingSvc --> Portfolio
IndicatorSvc --> PriceData
StrategySvc --> Strategy
MarketData --> AlphaVantage
PriceData --> DBService
AuthSvc --> DBService
TradingSvc --> DBService
DailyUpdate --> MarketData
DailyUpdate --> Cron
DBService --> UserModel
DBService --> WalletModel
DBService --> PortfolioModel
DBService --> TransactionModel
DBService --> PriceDataModel
TradingSvc --> Position
TradingSvc --> Security

@enduml
```

## Recommended Layout

### Vertical Layered Architecture (Recommended)

```
┌─────────────────────────────────────┐
│     Presentation Layer (Frontend)    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Application Layer (Backend)      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Business Logic Layer (Services) │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Domain Model Layer              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Data Access Layer               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Data Persistence Layer (DB)     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     External Services (Side)        │
└─────────────────────────────────────┘
```

## Color Coding Suggestions

- **Frontend**: Light Blue
- **Backend API**: Light Green
- **Services**: Light Yellow
- **Models**: Light Orange
- **Database**: Light Purple
- **External**: Light Red

## Export Format for Report

Export your architecture diagram as:
- **PNG** (high resolution, at least 300 DPI)
- **PDF** (vector format, scalable)
- **SVG** (vector format, best for documents)

Make sure the diagram:
- Is clear and readable
- Shows all major components
- Indicates data flow direction
- Includes technology stack labels
- Has a legend if using symbols

## What to Include in the Report

1. The visual architecture diagram
2. Brief description of each layer
3. Description of key modules
4. Data flow examples
5. Technology stack summary




## How to Create the Visual Architecture Diagram

### Option 1: Using draw.io (Recommended)

1. Go to [https://app.diagrams.net/](https://app.diagrams.net/)
2. Create a new diagram
3. Select "Blank Diagram" or "Software Architecture"

#### Step-by-Step Instructions:

##### Step 1: Create Layers (Use Containers/Rectangles)

Create 7 main layers from top to bottom:

1. **Presentation Layer** (Top)
2. **Application Layer**
3. **Business Logic Layer**
4. **Domain Model Layer**
5. **Data Access Layer**
6. **Data Persistence Layer**
7. **External Services** (Side or bottom)

##### Step 2: Add Components to Each Layer

**Presentation Layer:**
- Add 3 boxes:
  - "Pages (App Router)" - List: Dashboard, Trading, Portfolio, Transactions, Watchlist, Stock Details, Learn, Recommendations
  - "Components" - List: UI Components, Trading Forms, Portfolio UI, Indicators, Stock Views
  - "State Management (Zustand)" - List: authStore, portfolioStore, walletStore
- Add 1 box below:
  - "API Client (Axios)" - List: auth.ts, portfolio.ts, stocks.ts, trading.ts

**Application Layer:**
- Add 1 box for "Middleware Stack":
  - Helmet (Security)
  - CORS
  - Morgan (Logging)
  - Rate Limit
  - Auth Middleware
  - Validation Middleware
  - Error Middleware
- Add 1 box for "API Routes":
  - /portfolio/*
  - /user/*, /auth/*
  - /stocks/*
  - /wallet/*
  - /backtest/*
  - /paper-trading/*
  - /coupled-trade/*

**Business Logic Layer:**
- Add boxes for services:
  - "TradingService" - buyStock(), sellStock(), getWallet(), getHoldings()
  - "IndicatorService" - SMA, EMA, RSI, MACD, Bollinger Bands
  - "StrategyService" - TrendFollowing, MeanReversion, Momentum, Conservative
  - "MarketDataProvider" - getPrices(), getQuote(), Rate limiting
  - "PriceDataService" - getPriceData(), cacheData(), updateData()
  - "AuthService" - login(), register(), verifyToken()
  - "DailyUpdateService" - Scheduled price updates, Cron job

**Domain Model Layer:**
- Add boxes for models:
  - "Portfolio" - cash, horizon, rebalance()
  - "Position" - quantity, avgCost, P&L
  - "Security" - ticker, name, validate()
  - "Strategy" - name, rules, signals
  - "TechnicalIndicator" - compute(), signal()
  - "User" - userId, name, email

**Data Access Layer:**
- Add 1 box:
  - "DBService" - Abstraction layer with in-memory fallback
  - Methods: savePortfolio(), getUserPortfolios(), saveTransaction(), etc.

**Data Persistence Layer:**
- Add boxes for database models:
  - "UserModel"
  - "WalletModel"
  - "PortfolioModel"
  - "TransactionModel"
  - "PriceDataModel"
  - "BacktestSessionModel"
  - "PaperTradingSessionModel"
- Label as "MongoDB Atlas"

**External Services:**
- Add 1 box:
  - "Alpha Vantage API"
  - TIME_SERIES_DAILY, GLOBAL_QUOTE
  - Rate Limits: 5 calls/min, 500 calls/day
- Add 1 box:
  - "Cron Job Service"
  - Daily Updates

##### Step 3: Add Connections (Arrows)

Draw arrows showing data flow:

1. **Frontend to Backend:**
   - API Client → Application Layer (HTTP/REST API)

2. **Backend Internal:**
   - Routes → Services (multiple connections)
   - Services → Domain Models
   - Services → DBService
   - DBService → MongoDB Models

3. **External Connections:**
   - MarketDataProvider → Alpha Vantage API
   - DailyUpdateService → Alpha Vantage API
   - DailyUpdateService → Cron Job Service

4. **Data Flow:**
   - Use different arrow styles or colors for:
     - Request flow (solid arrows)
     - Response flow (dashed arrows)
     - Background processes (dotted arrows)

##### Step 4: Add Labels and Annotations

- Label each layer clearly
- Add technology stack labels:
  - Frontend: "Next.js, React, TypeScript"
  - Backend: "Express.js, Node.js"
  - Database: "MongoDB Atlas, Mongoose"
- Add protocol labels on connections:
  - "HTTP/REST API" between Frontend and Backend
  - "Mongoose ODM" between Services and Database

### Option 2: Using Lucidchart

1. Go to [https://www.lucidchart.com/](https://www.lucidchart.com/)
2. Select "Software Architecture" template
3. Follow similar steps as draw.io
4. Use Lucidchart's software architecture shapes

### Option 3: Using Mermaid (Text-Based)

For a quick text-based diagram, use Mermaid syntax:

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js)"]
        Pages["Pages<br/>Dashboard, Trading, Portfolio"]
        Components["Components<br/>UI, Forms, Views"]
        State["State Management<br/>Zustand Stores"]
        APIClient["API Client<br/>Axios"]
    end
    
    subgraph Backend["Backend (Express.js)"]
        Middleware["Middleware Stack<br/>Auth, Validation, Error"]
        Routes["API Routes<br/>/portfolio, /wallet, /stocks"]
    end
    
    subgraph Services["Business Logic Layer"]
        TradingSvc["TradingService"]
        IndicatorSvc["IndicatorService"]
        StrategySvc["StrategyService"]
        MarketData["MarketDataProvider"]
        PriceData["PriceDataService"]
        AuthSvc["AuthService"]
        DailyUpdate["DailyUpdateService"]
    end
    
    subgraph Models["Domain Models"]
        Portfolio["Portfolio"]
        Position["Position"]
        Security["Security"]
        Strategy["Strategy"]
    end
    
    subgraph Database["Data Access & Persistence"]
        DBService["DBService"]
        MongoDB["MongoDB Atlas<br/>User, Wallet, Portfolio,<br/>Transaction, PriceData"]
    end
    
    subgraph External["External Services"]
        AlphaVantage["Alpha Vantage API"]
        Cron["Cron Job Service"]
    end
    
    Pages --> APIClient
    Components --> APIClient
    State --> APIClient
    APIClient -->|HTTP/REST| Routes
    Routes --> Middleware
    Middleware --> TradingSvc
    Middleware --> IndicatorSvc
    Middleware --> StrategySvc
    Middleware --> AuthSvc
    TradingSvc --> MarketData
    TradingSvc --> Portfolio
    IndicatorSvc --> PriceData
    StrategySvc --> Strategy
    MarketData --> AlphaVantage
    PriceData --> DBService
    AuthSvc --> DBService
    TradingSvc --> DBService
    DailyUpdate --> MarketData
    DailyUpdate --> Cron
    DBService --> MongoDB
    TradingSvc --> Position
    TradingSvc --> Security
```

### Option 4: Using PlantUML

For a more detailed UML-style diagram:

```plantuml
@startuml
!define RECTANGLE class

package "Frontend Layer" {
  [Pages] as Pages
  [Components] as Components
  [State Management] as State
  [API Client] as APIClient
}

package "Application Layer" {
  [Middleware Stack] as Middleware
  [API Routes] as Routes
}

package "Business Logic Layer" {
  [TradingService] as TradingSvc
  [IndicatorService] as IndicatorSvc
  [StrategyService] as StrategySvc
  [MarketDataProvider] as MarketData
  [PriceDataService] as PriceData
  [AuthService] as AuthSvc
  [DailyUpdateService] as DailyUpdate
}

package "Domain Model Layer" {
  [Portfolio] as Portfolio
  [Position] as Position
  [Security] as Security
  [Strategy] as Strategy
}

package "Data Access Layer" {
  [DBService] as DBService
}

database "MongoDB Atlas" {
  [UserModel] as UserModel
  [WalletModel] as WalletModel
  [PortfolioModel] as PortfolioModel
  [TransactionModel] as TransactionModel
  [PriceDataModel] as PriceDataModel
}

cloud "External Services" {
  [Alpha Vantage API] as AlphaVantage
  [Cron Job] as Cron
}

Pages --> APIClient
Components --> APIClient
State --> APIClient
APIClient --> Routes : HTTP/REST
Routes --> Middleware
Middleware --> TradingSvc
Middleware --> IndicatorSvc
Middleware --> StrategySvc
Middleware --> AuthSvc
TradingSvc --> MarketData
TradingSvc --> Portfolio
IndicatorSvc --> PriceData
StrategySvc --> Strategy
MarketData --> AlphaVantage
PriceData --> DBService
AuthSvc --> DBService
TradingSvc --> DBService
DailyUpdate --> MarketData
DailyUpdate --> Cron
DBService --> UserModel
DBService --> WalletModel
DBService --> PortfolioModel
DBService --> TransactionModel
DBService --> PriceDataModel
TradingSvc --> Position
TradingSvc --> Security

@enduml
```

## Recommended Layout

### Vertical Layered Architecture (Recommended)

```
┌─────────────────────────────────────┐
│     Presentation Layer (Frontend)    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Application Layer (Backend)      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Business Logic Layer (Services) │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Domain Model Layer              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Data Access Layer               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Data Persistence Layer (DB)     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     External Services (Side)        │
└─────────────────────────────────────┘
```

## Color Coding Suggestions

- **Frontend**: Light Blue
- **Backend API**: Light Green
- **Services**: Light Yellow
- **Models**: Light Orange
- **Database**: Light Purple
- **External**: Light Red

## Export Format for Report

Export your architecture diagram as:
- **PNG** (high resolution, at least 300 DPI)
- **PDF** (vector format, scalable)
- **SVG** (vector format, best for documents)

Make sure the diagram:
- Is clear and readable
- Shows all major components
- Indicates data flow direction
- Includes technology stack labels
- Has a legend if using symbols

## What to Include in the Report

1. The visual architecture diagram
2. Brief description of each layer
3. Description of key modules
4. Data flow examples
5. Technology stack summary


