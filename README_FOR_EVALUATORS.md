# Horizon Trading Platform - Setup Guide for Evaluators

## Team Members
- Ayush Dodia
- Nithik Pandya
- Vraj Shah

## Important Note: Environment Variables

**⚠️ The `.env` file is NOT included in the submission for security reasons.** It contains sensitive information including:
- MongoDB Atlas connection strings
- Alpha Vantage API keys
- JWT secrets

You will need to create your own `.env` file to run the application. Instructions are provided below.

---

## Prerequisites

Before running the application, ensure you have:

1. **Node.js** (version 14.0.0 or higher)
   - Check version: `node --version`
   - Download from: https://nodejs.org/

2. **MongoDB Atlas Account** (or local MongoDB instance)
   - Free tier available at: https://www.mongodb.com/cloud/atlas
   - Or install MongoDB locally

3. **Alpha Vantage API Key** (optional, for real-time data)
   - Free tier available at: https://www.alphavantage.co/support/#api-key
   - Free tier limits: 5 API calls/minute, 500 calls/day

4. **npm** (comes with Node.js)
   - Check version: `npm --version`

---

## Installation Steps

### Step 1: Extract the ZIP File

Extract the provided ZIP file to a directory of your choice.

### Step 2: Install Backend Dependencies

Open a terminal in the project root directory and run:

```bash
npm install
```

This will install all required Node.js packages for the backend.

### Step 3: Install Frontend Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
cd ..
```

### Step 4: Create Environment Variables File

Create a `.env` file in the project root directory with the following structure:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# Alpha Vantage API Keys (optional - system can work with limited functionality without them)
ALPHA_VANTAGE_API_KEY=your_api_key_here
ALPHA_VANTAGE_API_KEY_2=your_secondary_key_here (optional)

# Gemini API Key (optional - for AI-enhanced insights in stock recommendations)
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secret (generate a random string)
JWT_SECRET=your_random_secret_string_here

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (for frontend)
CORS_ORIGIN=http://localhost:3001

# Daily Updates (optional)
ENABLE_DAILY_UPDATES=false
```

**Where to get these values:**

1. **MONGODB_URI**: 
   - Sign up for MongoDB Atlas (free tier)
   - Create a cluster
   - Click "Connect" → "Connect your application"
   - Copy the connection string and replace `<password>` with your password

2. **ALPHA_VANTAGE_API_KEY**: 
   - Sign up at https://www.alphavantage.co/support/#api-key
   - Copy your API key
   - Note: The system can run tests without this, but some features require it

3. **GEMINI_API_KEY** (Optional):
   - Sign up at https://makersuite.google.com/app/apikey (Google AI Studio)
   - Copy your API key
   - Note: This enables AI-enhanced insights in the "Generate Insights" feature
   - The system works without this, but insights will be basic (no AI enhancement)

4. **JWT_SECRET**: 
   - Generate any random string (e.g., `openssl rand -base64 32`)
   - Or use any secure random string

5. **CORS_ORIGIN**: 
   - Keep as `http://localhost:3001` (default frontend port)

### Step 5: Verify Installation

Check that all dependencies are installed:

```bash
# Check backend dependencies
npm list --depth=0

# Check frontend dependencies
cd frontend && npm list --depth=0 && cd ..
```

---

## Running the Application

### Option 1: Run Backend Only (for Testing)

Start the backend server:

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

You should see output like:
```
✅ MongoDB connected successfully
✅ Server running on port 3000
```

### Option 2: Run Full Application (Backend + Frontend)

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3001`.

Open your browser and navigate to `http://localhost:3001` to access the application.

---

## Running Tests

The project uses **Jasmine** as the testing framework. All tests are located in the `spec/` directory.

### Run All Tests

```bash
npm test
```

This will run both unit tests and integration tests.

### Run Only Unit Tests

```bash
npm test -- spec/unit
```

### Run Only Integration Tests

```bash
npm run test:integration
```

Or:

```bash
npm test -- spec/integration
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

This will automatically re-run tests when files change.

### Expected Test Results

You should see output similar to:

```
Started
.....
  IndicatorService
    ✓ should create SMA indicator with default parameters
    ✓ should create RSI indicator with custom parameters
    ...
  
  Security Model
    ✓ should initialize security with ticker
    ...
  
  StrategyService
    ✓ should initialize with all pre-built strategies
    ...

Finished in X.XXX seconds
X specs, 0 failures
```

### Test Structure

- **Unit Tests** (`spec/unit/`):
  - `IndicatorServiceSpec.js` - Tests technical indicator calculations
  - `SecuritySpec.js` - Tests Security model
  - `StrategyServiceSpec.js` - Tests strategy service
  - `StrategySpec.js` - Tests Strategy model

- **Integration Tests** (`spec/integration/`):
  - `auth.routes.spec.js` - Tests authentication endpoints
  - `portfolio.routes.spec.js` - Tests portfolio endpoints
  - `stock.routes.spec.js` - Tests stock data endpoints

### Troubleshooting Tests

**Issue: Tests fail with database connection errors**

- Ensure MongoDB is running and accessible
- Check your `MONGODB_URI` in `.env` file
- The system has an in-memory fallback mode, but some tests require database connection

**Issue: Tests fail with API errors**

- Some tests may require Alpha Vantage API key
- You can run unit tests without API keys (they use mock data)
- Integration tests that fetch real data may need API keys

**Issue: Port already in use**

- Change the `PORT` in `.env` file
- Or stop the process using the port:
  ```bash
  # Find process using port 3000
  lsof -i :3000
  # Kill the process
  kill -9 <PID>
  ```

---

## CSV Market Data File

A sample CSV file (`market_data_sample.csv`) is included in the submission. This file contains historical stock price data for testing purposes.

### CSV Format

The CSV file contains the following columns:
- **Date**: Trading date (YYYY-MM-DD format)
- **Ticker**: Stock symbol (e.g., AAPL, MSFT, GOOGL)
- **Open**: Opening price
- **High**: Highest price of the day
- **Low**: Lowest price of the day
- **Close**: Closing price
- **Volume**: Trading volume

### Using the CSV File

The CSV file is provided for:
1. **Testing purposes**: You can use this data to verify calculations
2. **Reference**: To understand the data format expected by the system
3. **Validation**: To compare system calculations with known values

**Note**: The system primarily uses data from MongoDB (populated via Alpha Vantage API), but the CSV serves as a reference for testing and validation.

---

## Project Structure

```
Horizon Trading/
├── src/                    # Backend source code
│   ├── api/               # API routes and server
│   ├── db/                # Database models and service
│   ├── models/            # Domain models (Portfolio, Position, etc.)
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── frontend/              # Next.js frontend application
├── spec/                  # Jasmine test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── helpers/          # Test helper functions
├── config/               # Configuration files
├── scripts/               # Utility scripts
├── cache/                 # API response cache
├── market_data_sample.csv # Sample market data for testing
├── package.json          # Backend dependencies
└── README_FOR_EVALUATORS.md # This file
```

---

## Key Features to Test

1. **Technical Indicators**: SMA, EMA, RSI, MACD, Bollinger Bands
2. **Trading Strategies**: Trend Following, Mean Reversion, Momentum, Conservative
3. **Portfolio Management**: Create portfolios, track positions, calculate P&L
4. **Virtual Trading**: Buy/sell stocks, transaction history, wallet management
5. **User Authentication**: Registration, login, JWT tokens

---

## Common Issues and Solutions

### Issue: "Cannot find module" errors

**Solution**: Run `npm install` in both root and frontend directories.

### Issue: MongoDB connection fails

**Solution**: 
- Verify MongoDB Atlas cluster is running
- Check connection string in `.env`
- Ensure IP address is whitelisted in MongoDB Atlas

### Issue: API rate limit errors

**Solution**: 
- Alpha Vantage free tier has limits (5 calls/min, 500/day)
- Wait a few minutes and try again
- Or use multiple API keys (set `ALPHA_VANTAGE_API_KEY_2` in `.env`)

### Issue: Frontend can't connect to backend

**Solution**:
- Ensure backend is running on port 3000
- Check `CORS_ORIGIN` in `.env` matches frontend URL
- Verify frontend API client configuration

### Issue: Tests timeout

**Solution**:
- Some tests may take longer if database connection is slow
- Increase timeout in `spec/support/jasmine.json` if needed
- Ensure MongoDB is accessible

---

## Additional Resources

- **Project Documentation**: See `/docs` directory for detailed documentation
- **API Documentation**: See main `README.md` for API endpoint details
- **Test Helpers**: See `spec/helpers/testHelpers.js` for test utilities

---

## Contact

If you encounter any issues not covered in this guide, please contact me on ayush.dodia@rutgers.edu

---




## Team Members
- Ayush Dodia
- Nithik Pandya
- Vraj Shah

## Important Note: Environment Variables

**⚠️ The `.env` file is NOT included in the submission for security reasons.** It contains sensitive information including:
- MongoDB Atlas connection strings
- Alpha Vantage API keys
- JWT secrets

You will need to create your own `.env` file to run the application. Instructions are provided below.

---

## Prerequisites

Before running the application, ensure you have:

1. **Node.js** (version 14.0.0 or higher)
   - Check version: `node --version`
   - Download from: https://nodejs.org/

2. **MongoDB Atlas Account** (or local MongoDB instance)
   - Free tier available at: https://www.mongodb.com/cloud/atlas
   - Or install MongoDB locally

3. **Alpha Vantage API Key** (optional, for real-time data)
   - Free tier available at: https://www.alphavantage.co/support/#api-key
   - Free tier limits: 5 API calls/minute, 500 calls/day

4. **npm** (comes with Node.js)
   - Check version: `npm --version`

---

## Installation Steps

### Step 1: Extract the ZIP File

Extract the provided ZIP file to a directory of your choice.

### Step 2: Install Backend Dependencies

Open a terminal in the project root directory and run:

```bash
npm install
```

This will install all required Node.js packages for the backend.

### Step 3: Install Frontend Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
cd ..
```

### Step 4: Create Environment Variables File

Create a `.env` file in the project root directory with the following structure:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# Alpha Vantage API Keys (optional - system can work with limited functionality without them)
ALPHA_VANTAGE_API_KEY=your_api_key_here
ALPHA_VANTAGE_API_KEY_2=your_secondary_key_here (optional)

# Gemini API Key (optional - for AI-enhanced insights in stock recommendations)
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secret (generate a random string)
JWT_SECRET=your_random_secret_string_here

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (for frontend)
CORS_ORIGIN=http://localhost:3001

# Daily Updates (optional)
ENABLE_DAILY_UPDATES=false
```

**Where to get these values:**

1. **MONGODB_URI**: 
   - Sign up for MongoDB Atlas (free tier)
   - Create a cluster
   - Click "Connect" → "Connect your application"
   - Copy the connection string and replace `<password>` with your password

2. **ALPHA_VANTAGE_API_KEY**: 
   - Sign up at https://www.alphavantage.co/support/#api-key
   - Copy your API key
   - Note: The system can run tests without this, but some features require it

3. **GEMINI_API_KEY** (Optional):
   - Sign up at https://makersuite.google.com/app/apikey (Google AI Studio)
   - Copy your API key
   - Note: This enables AI-enhanced insights in the "Generate Insights" feature
   - The system works without this, but insights will be basic (no AI enhancement)

4. **JWT_SECRET**: 
   - Generate any random string (e.g., `openssl rand -base64 32`)
   - Or use any secure random string

5. **CORS_ORIGIN**: 
   - Keep as `http://localhost:3001` (default frontend port)

### Step 5: Verify Installation

Check that all dependencies are installed:

```bash
# Check backend dependencies
npm list --depth=0

# Check frontend dependencies
cd frontend && npm list --depth=0 && cd ..
```

---

## Running the Application

### Option 1: Run Backend Only (for Testing)

Start the backend server:

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

You should see output like:
```
✅ MongoDB connected successfully
✅ Server running on port 3000
```

### Option 2: Run Full Application (Backend + Frontend)

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3001`.

Open your browser and navigate to `http://localhost:3001` to access the application.

---

## Running Tests

The project uses **Jasmine** as the testing framework. All tests are located in the `spec/` directory.

### Run All Tests

```bash
npm test
```

This will run both unit tests and integration tests.

### Run Only Unit Tests

```bash
npm test -- spec/unit
```

### Run Only Integration Tests

```bash
npm run test:integration
```

Or:

```bash
npm test -- spec/integration
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

This will automatically re-run tests when files change.

### Expected Test Results

You should see output similar to:

```
Started
.....
  IndicatorService
    ✓ should create SMA indicator with default parameters
    ✓ should create RSI indicator with custom parameters
    ...
  
  Security Model
    ✓ should initialize security with ticker
    ...
  
  StrategyService
    ✓ should initialize with all pre-built strategies
    ...

Finished in X.XXX seconds
X specs, 0 failures
```

### Test Structure

- **Unit Tests** (`spec/unit/`):
  - `IndicatorServiceSpec.js` - Tests technical indicator calculations
  - `SecuritySpec.js` - Tests Security model
  - `StrategyServiceSpec.js` - Tests strategy service
  - `StrategySpec.js` - Tests Strategy model

- **Integration Tests** (`spec/integration/`):
  - `auth.routes.spec.js` - Tests authentication endpoints
  - `portfolio.routes.spec.js` - Tests portfolio endpoints
  - `stock.routes.spec.js` - Tests stock data endpoints

### Troubleshooting Tests

**Issue: Tests fail with database connection errors**

- Ensure MongoDB is running and accessible
- Check your `MONGODB_URI` in `.env` file
- The system has an in-memory fallback mode, but some tests require database connection

**Issue: Tests fail with API errors**

- Some tests may require Alpha Vantage API key
- You can run unit tests without API keys (they use mock data)
- Integration tests that fetch real data may need API keys

**Issue: Port already in use**

- Change the `PORT` in `.env` file
- Or stop the process using the port:
  ```bash
  # Find process using port 3000
  lsof -i :3000
  # Kill the process
  kill -9 <PID>
  ```

---

## CSV Market Data File

A sample CSV file (`market_data_sample.csv`) is included in the submission. This file contains historical stock price data for testing purposes.

### CSV Format

The CSV file contains the following columns:
- **Date**: Trading date (YYYY-MM-DD format)
- **Ticker**: Stock symbol (e.g., AAPL, MSFT, GOOGL)
- **Open**: Opening price
- **High**: Highest price of the day
- **Low**: Lowest price of the day
- **Close**: Closing price
- **Volume**: Trading volume

### Using the CSV File

The CSV file is provided for:
1. **Testing purposes**: You can use this data to verify calculations
2. **Reference**: To understand the data format expected by the system
3. **Validation**: To compare system calculations with known values

**Note**: The system primarily uses data from MongoDB (populated via Alpha Vantage API), but the CSV serves as a reference for testing and validation.

---

## Project Structure

```
Horizon Trading/
├── src/                    # Backend source code
│   ├── api/               # API routes and server
│   ├── db/                # Database models and service
│   ├── models/            # Domain models (Portfolio, Position, etc.)
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── frontend/              # Next.js frontend application
├── spec/                  # Jasmine test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── helpers/          # Test helper functions
├── config/               # Configuration files
├── scripts/               # Utility scripts
├── cache/                 # API response cache
├── market_data_sample.csv # Sample market data for testing
├── package.json          # Backend dependencies
└── README_FOR_EVALUATORS.md # This file
```

---

## Key Features to Test

1. **Technical Indicators**: SMA, EMA, RSI, MACD, Bollinger Bands
2. **Trading Strategies**: Trend Following, Mean Reversion, Momentum, Conservative
3. **Portfolio Management**: Create portfolios, track positions, calculate P&L
4. **Virtual Trading**: Buy/sell stocks, transaction history, wallet management
5. **User Authentication**: Registration, login, JWT tokens

---

## Common Issues and Solutions

### Issue: "Cannot find module" errors

**Solution**: Run `npm install` in both root and frontend directories.

### Issue: MongoDB connection fails

**Solution**: 
- Verify MongoDB Atlas cluster is running
- Check connection string in `.env`
- Ensure IP address is whitelisted in MongoDB Atlas

### Issue: API rate limit errors

**Solution**: 
- Alpha Vantage free tier has limits (5 calls/min, 500/day)
- Wait a few minutes and try again
- Or use multiple API keys (set `ALPHA_VANTAGE_API_KEY_2` in `.env`)

### Issue: Frontend can't connect to backend

**Solution**:
- Ensure backend is running on port 3000
- Check `CORS_ORIGIN` in `.env` matches frontend URL
- Verify frontend API client configuration

### Issue: Tests timeout

**Solution**:
- Some tests may take longer if database connection is slow
- Increase timeout in `spec/support/jasmine.json` if needed
- Ensure MongoDB is accessible

---

## Additional Resources

- **Project Documentation**: See `/docs` directory for detailed documentation
- **API Documentation**: See main `README.md` for API endpoint details
- **Test Helpers**: See `spec/helpers/testHelpers.js` for test utilities

---

## Contact

If you encounter any issues not covered in this guide, please contact me on ayush.dodia@rutgers.edu

---


