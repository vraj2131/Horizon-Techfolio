# How SMA and EMA Are Calculated Using Historical Data

## Overview

All technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands) are calculated using **real historical price data** from your MongoDB database, which is updated daily via cron jobs and Alpha Vantage API.

## Data Flow

```
1. Historical Price Data (MongoDB) 
   ↓
2. PriceDataService.getPriceData() 
   ↓
3. Extract closing prices: priceData.map(point => point.close)
   ↓
4. Indicator.compute(closes) 
   ↓
5. calculateSMA() or calculateEMA() 
   ↓
6. Calculate signals based on indicator values
```

## 1. Simple Moving Average (SMA)

### How It Works

SMA calculates the **average closing price over a rolling window** (e.g., 20 days).

### Formula
```
SMA = (P₁ + P₂ + P₃ + ... + Pₙ) / n

Where:
- P = Closing prices
- n = Window size (e.g., 20 days)
```

### Step-by-Step Calculation

**Example: 20-day SMA**

Given historical closing prices:
```
Day 1:  $100
Day 2:  $102
Day 3:  $101
...
Day 20: $110
Day 21: $112
Day 22: $115
```

**Calculation:**
1. **First SMA value** (Day 20): 
   - Sum prices from Day 1-20: `$100 + $102 + ... + $110 = $2,000`
   - Divide by 20: `$2,000 / 20 = $100.00`

2. **Second SMA value** (Day 21):
   - Sum prices from Day 2-21: `$102 + $101 + ... + $112 = $2,040`
   - Divide by 20: `$2,040 / 20 = $102.00`

3. **Third SMA value** (Day 22):
   - Sum prices from Day 3-22: `$101 + ... + $115 = $2,060`
   - Divide by 20: `$2,060 / 20 = $103.00`

### Code Implementation

```javascript
// From src/utils/calculations.js
function calculateSMA(values, window) {
  const sma = [];
  for (let i = window - 1; i < values.length; i++) {
    // Get the last 'window' prices
    const windowPrices = values.slice(i - window + 1, i + 1);
    // Sum them
    const sum = windowPrices.reduce((a, b) => a + b, 0);
    // Divide by window size
    sma.push(sum / window);
  }
  return sma;
}
```

**Key Points:**
- Requires at least `window` data points (e.g., 20 days for 20-day SMA)
- Each SMA value is the average of the previous `window` closing prices
- The SMA array has `length - window + 1` values (first value appears at index `window - 1`)

---

## 2. Exponential Moving Average (EMA)

### How It Works

EMA gives **more weight to recent prices** than older prices, making it more responsive to price changes than SMA.

### Formula
```
EMA = (Current Price × Smoothing Factor) + (Previous EMA × (1 - Smoothing Factor))

Where:
Smoothing Factor (α) = 2 / (window + 1)

For 12-day EMA: α = 2 / (12 + 1) = 0.1538 (or 15.38%)
```

### Step-by-Step Calculation

**Example: 12-day EMA**

Given historical closing prices:
```
Day 1:  $100
Day 2:  $102
Day 3:  $101
...
Day 12: $110
Day 13: $112
Day 14: $115
```

**Calculation:**
1. **First EMA value** (Day 1): 
   - Start with first closing price: `EMA₁ = $100.00`

2. **Second EMA value** (Day 2):
   - `α = 2 / (12 + 1) = 0.1538`
   - `EMA₂ = ($102 × 0.1538) + ($100 × 0.8462) = $100.31`

3. **Third EMA value** (Day 3):
   - `EMA₃ = ($101 × 0.1538) + ($100.31 × 0.8462) = $100.45`

4. **Continue for all days...**
   - Each new EMA gives 15.38% weight to the new price and 84.62% weight to the previous EMA

### Code Implementation

```javascript
// From src/utils/calculations.js
function calculateEMA(values, window, alpha = null) {
  const smoothingFactor = alpha || (2 / (window + 1));
  const ema = [values[0]]; // Start with first value
  
  for (let i = 1; i < values.length; i++) {
    // New EMA = (Current Price × α) + (Previous EMA × (1 - α))
    const emaValue = (values[i] * smoothingFactor) + 
                     (ema[i - 1] * (1 - smoothingFactor));
    ema.push(emaValue);
  }
  
  return ema;
}
```

**Key Points:**
- EMA starts with the first closing price
- Each subsequent value gives more weight to recent prices
- EMA reacts faster to price changes than SMA
- EMA array has the **same length** as the input price array (unlike SMA)

---

## 3. Real Data Flow in Your System

### Step 1: Fetch Historical Data
```javascript
// From src/api/routes.js - getStockIndicators()
const today = new Date();
const endDate = today.toISOString().split('T')[0];
const startDate = new Date(today);
startDate.setFullYear(startDate.getFullYear() - 1); // Last year

const priceDataService = new PriceDataService();
const priceData = await priceDataService.getPriceData(ticker, startDate, endDate, 'daily');
// Returns: [{ date: '2024-01-01', open: 150, high: 152, low: 149, close: 151, volume: 1000000 }, ...]
```

### Step 2: Extract Closing Prices
```javascript
// From src/models/TechnicalIndicator.js - compute()
const closes = priceData.map(point => point.close);
// Returns: [151.23, 152.45, 150.89, 153.12, ...]
```

### Step 3: Calculate Indicator
```javascript
// For SMA (20-day window)
const smaIndicator = IndicatorService.createIndicator('SMA', { window: 20 });
const smaValues = smaIndicator.compute(priceData);
// Returns: [150.23, 151.45, 152.89, ...] (one value per day after first 20 days)

// For EMA (12-day window)
const emaIndicator = IndicatorService.createIndicator('EMA', { window: 12 });
const emaValues = emaIndicator.compute(priceData);
// Returns: [151.23, 151.45, 151.89, ...] (one value per day, starting from day 1)
```

### Step 4: Generate Signals
```javascript
// Signal logic: Price crossing above SMA/EMA = Buy signal
if (previousPrice <= previousSMA && currentPrice > currentSMA) {
  return 'buy';
}
```

---

## 4. Example with Real Numbers

Let's say we have **AAPL** closing prices for the last 25 days:

```
Day 1-19:  ... (historical data)
Day 20:    $150.00
Day 21:    $152.00
Day 22:    $151.00
Day 23:    $153.00
Day 24:    $155.00
Day 25:    $154.00 (today)
```

### 20-Day SMA Calculation:
- **SMA for Day 20**: Average of Days 1-20
- **SMA for Day 21**: Average of Days 2-21
- **SMA for Day 22**: Average of Days 3-22
- **SMA for Day 23**: Average of Days 4-23
- **SMA for Day 24**: Average of Days 5-24
- **SMA for Day 25**: Average of Days 6-25 (most recent)

### 12-Day EMA Calculation:
- **EMA for Day 1**: $150.00 (starting value)
- **EMA for Day 2**: ($152.00 × 0.1538) + ($150.00 × 0.8462) = $150.31
- **EMA for Day 3**: ($151.00 × 0.1538) + ($150.31 × 0.8462) = $150.42
- ... continues for all days
- **EMA for Day 25**: Calculated from Day 25 price and Day 24 EMA

---

## 5. Why This Matters

✅ **Dynamic**: Every calculation uses the **latest** historical data from your database  
✅ **Accurate**: Based on real market prices, not static values  
✅ **Updated Daily**: Cron job updates data every day, so indicators recalculate with fresh data  
✅ **Real-time**: When you view indicators, they use the most recent data available  

---

## Summary

- **SMA**: Simple average of last N closing prices (equal weight to all)
- **EMA**: Weighted average that gives more importance to recent prices
- **Both use real historical data** from MongoDB (updated daily)
- **Calculations are dynamic** - they recalculate every time you request indicators
- **No static values** - everything is computed from actual price history

