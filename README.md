# Horizon Trading Platform

A comprehensive technical analysis and portfolio management system that combines AI-enhanced insights, backtesting capabilities, and educational resources to help users make informed trading decisions across different investment horizons.

## 🚀 Features

### 📊 Portfolio Management
- **Curated Portfolios**: Pre-built portfolios (Growth, Balanced, Defensive) for 1, 2, and 5-year investment horizons
- **Custom Portfolios**: Create personalized portfolios by selecting individual stocks
- **Real-time P&L Tracking**: Monitor portfolio performance with live profit/loss calculations
- **Position Management**: Track holdings, average cost, and current values

### 📈 Technical Analysis
- **5 Core Indicators**: 
  - SMA (Simple Moving Average)
  - EMA (Exponential Moving Average)
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
- **Interactive Learning**: Educational page with interactive calculators for each indicator
- **Signal Generation**: Automated buy/sell/hold signals based on technical indicators

### 🤖 AI-Enhanced Insights
- **Gemini AI Integration**: Get intelligent explanations and insights for stock recommendations
- **Context-Aware Analysis**: AI provides detailed explanations of trading signals and market conditions

### 🔄 Backtesting Engine
- **Historical Strategy Testing**: Test trading strategies on historical data
- **Performance Metrics**: Calculate total return, max drawdown, win rate, CAGR, and more
- **Multiple Strategies**: 
  - Trend Following
  - Mean Reversion
  - Momentum
  - Conservative

### 💼 Virtual Trading
- **Paper Trading**: Practice trading without real money
- **Wallet Management**: Track virtual cash balance and transactions
- **Transaction History**: Complete audit trail of all buy/sell operations

### 📚 Educational Resources
- **Learn Page**: Comprehensive guide to technical indicators
- **Interactive Calculators**: Step-by-step calculations for each indicator
- **Visual Explanations**: Clear examples and signal interpretations

## 📸 Screenshots

### Dashboard
![Dashboard](./screenshots/dashboard.png)
*User dashboard showing portfolio overview, wallet balance, and quick access to key features*

### Market Watchlist
![Market Watchlist](./screenshots/market_watchlist.png)
*Real-time market watchlist displaying all 20 stocks with live prices, changes, and trading volume*

### Trading Interface
![Trading Interface](./screenshots/trading_interface.png)
*Virtual trading interface for buying and selling stocks with real-time pricing and holdings management*

### Generate Insights
![Generate Insights](./screenshots/Insights.png)
*AI-powered stock insights with strategy recommendations, confidence levels, and detailed analysis*

### AI-Enhanced Insights
![AI-Enhanced Insights](./screenshots/AI_insights.png)
*Gemini AI-powered enhanced insights with detailed explanations, risk assessment, and actionable recommendations*

## 🛠️ Technology Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB Atlas** with **Mongoose**
- **JWT Authentication** with refresh tokens
- **Alpha Vantage API** for market data
- **Google Gemini AI** for enhanced insights

### Frontend
- **Next.js 14** with App Router
- **React** with **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **TradingView Charting Library** for visualizations

### Testing
- **Jasmine** testing framework
- Unit and integration tests

## 📋 Prerequisites

Before running the application, ensure you have:

- **Node.js** (version 14.0.0 or higher)
- **MongoDB Atlas Account** (free tier available) or local MongoDB instance
- **Alpha Vantage API Key** (optional, for real-time data)
- **Gemini API Key** (optional, for AI-enhanced insights)
- **npm** (comes with Node.js)

## 🚀 How to Run the Project

### Step 1: Clone the Repository

```bash
git clone https://github.com/Ayushhh26/Horizon-Techfolio.git
cd Horizon-Techfolio
```

### Step 2: Install Dependencies

**Backend:**
   ```bash
   npm install
   ```

**Frontend:**
   ```bash
cd frontend
npm install
cd ..
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root directory:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# Alpha Vantage API Keys (optional)
ALPHA_VANTAGE_API_KEY=your_api_key_here
ALPHA_VANTAGE_API_KEY_2=your_secondary_key_here

# Gemini API Key (optional - for AI-enhanced insights)
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secret (generate a random string)
JWT_SECRET=your_random_secret_string_here

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

**Where to get these values:**
- **MONGODB_URI**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Create a free cluster and get connection string
- **ALPHA_VANTAGE_API_KEY**: [Alpha Vantage](https://www.alphavantage.co/support/#api-key) - Free tier: 5 calls/min, 500/day
- **GEMINI_API_KEY**: [Google AI Studio](https://makersuite.google.com/app/apikey) - For AI-enhanced insights
- **JWT_SECRET**: Generate with `openssl rand -base64 32`

### Step 4: Run the Application

**Terminal 1 - Backend Server:**
   ```bash
   npm start
   ```

The backend will start on `http://localhost:3000`

**Terminal 2 - Frontend Application:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3001`

### Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:3001
```

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm test -- spec/unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch
```

## 📁 Project Structure

```
Horizon Trading/
├── src/                    # Backend source code
│   ├── api/               # API routes and server
│   │   ├── routes/       # Route handlers
│   │   └── middleware/   # Authentication & validation
│   ├── db/               # Database models and service
│   ├── models/           # Domain models (Portfolio, Position, etc.)
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── frontend/             # Next.js frontend application
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components
│   └── lib/             # Utilities and API client
├── spec/                 # Jasmine test files
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── config/             # Configuration files
├── scripts/            # Utility scripts
└── docs/              # Project documentation
```

## 👥 Team Members

- **Ayush Dodia** - Backend Architecture, Database Design, System Integration
- **Nithik Pandya** - Trading Engine, Backtesting, Strategy Implementation
- **Vraj Shah** - Frontend Development, Technical Indicators, AI Integration

## 📖 Documentation

For detailed setup instructions and troubleshooting, see:
- [Setup Guide for Evaluators](./README_FOR_EVALUATORS.md)
- [Project Documentation](./docs/)

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Helmet.js for security headers
- CORS configuration
- Rate limiting and DDoS protection
- Input validation and sanitization

## 📝 License

MIT License

## 🤝 Contributing

This is a course project. For questions or issues, please contact:
- **Email**: vrajshah53@gmail.com

---

**Note**: The `.env` file is not included in the repository for security reasons. You must create your own `.env` file following the instructions above.

