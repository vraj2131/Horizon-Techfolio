# Price Data Management Strategy

## Problem Solved

Alpha Vantage free tier has strict limits:
- **5 API calls per minute**
- **500 API calls per day**

For a portfolio with 20 stocks, calculating indicators for all stocks could mean:
- **20+ API calls every time** signals are requested
- **Easy to hit rate limits** during development/testing
- **Slow performance** due to API latency

## Solution: MongoDB Storage + Smart Caching

### How It Works

1. **Initial Fetch** (One-time per ticker):
   - When a portfolio is created, full historical data (20+ years) is fetched ONCE
   - Stored in MongoDB with full price history
   - Cache TTL: Never expires (historical data doesn't change)

2. **Daily Updates** (Automatic):
   - Background service checks hourly for tickers needing updates
   - Only fetches latest trading day data (not full history)
   - Updates happen automatically after market close
   - Respects rate limits (12 seconds between calls = 5/min)

3. **Data Retrieval** (Fast):
   - Checks MongoDB first (fast, no API call)
   - Falls back to file cache if DB unavailable
   - Only calls API if data not found anywhere

### API Call Reduction

**Before (with file cache):**
- Every signal calculation: ~20 API calls
- Different date ranges: Multiple API calls per ticker
- Cache expires after 24 hours: Re-fetches everything
- **Result**: Easy to hit 500/day limit

**After (with MongoDB storage):**
- Portfolio creation: ~20 API calls (one-time, per ticker)
- Daily updates: 1-2 API calls per ticker per day
- Signal calculations: **0 API calls** (uses stored data)
- **Result**: ~20-40 API calls per day total (well under 500 limit)

**Reduction: ~95% fewer API calls**

## Implementation Details

### Components

1. **PriceDataModel** (`src/db/models/PriceDataModel.js`)
   - Stores full historical price data per ticker
   - Indexed for fast queries
   - Tracks last update date

2. **PriceDataService** (`src/services/PriceDataService.js`)
   - Retrieves data: DB → Cache → API (fallback chain)
   - Saves data to database
   - Merges new data with existing (no duplicates)

3. **DailyUpdateService** (`src/services/DailyUpdateService.js`)
   - Background service running in server
   - Checks hourly for tickers needing updates
   - Batch updates respecting rate limits

### Data Flow

```
Portfolio Created
    ↓
Initialize Tickers (background)
    ↓
Fetch Full History (20+ years) → Store in MongoDB
    ↓
Daily Updates (automatic, hourly check)
    ↓
Fetch Latest Day Only → Merge with existing data
    ↓
Indicator Calculations
    ↓
Read from MongoDB (no API call!)
```

## Daily Update Schedule

According to [Alpha Vantage documentation](https://www.alphavantage.co/documentation/):
> "Data is updated at the end of each trading day for all users by default"

**Best Time to Update**: After market close (4:00 PM ET / 9:00 PM UTC)

### Automatic Updates

The server includes a background service that:
- Checks every hour for tickers needing updates
- Updates only if data is >1 day old
- Respects rate limits (waits 12 seconds between calls)

### Manual Updates

Run the update script:
```bash
# Update all tickers needing update
npm run update-prices

# Update specific tickers
node scripts/daily-update.js AAPL MSFT GOOGL
```

### Cron Job (Optional)

Set up a cron job to run daily after market close:

```bash
# Edit crontab
crontab -e

# Add this line (runs at 5:00 PM ET daily)
0 21 * * 1-5 cd /path/to/Horizon-Trading && npm run update-prices
```

## How to Use

### During Development

1. **First Time**: Create a portfolio
   - Background job fetches full history for all tickers
   - Takes a few minutes (respects rate limits)
   - Subsequent requests are instant!

2. **Daily Use**: 
   - Indicator calculations use database (fast!)
   - No API calls needed
   - Updates happen automatically

3. **Manual Update** (if needed):
   ```bash
   npm run update-prices
   ```

### For Your Team

**Shared Database Benefits:**
- First team member creates portfolio → fetches data once
- All team members can use the same data
- No duplicate API calls
- Faster development

**Setup:**
- Everyone connects to same MongoDB Atlas database
- Data is automatically shared
- Each person's portfolio uses cached data

## Configuration

### Enable/Disable Daily Updates

The service automatically starts if database is connected. To disable:

```javascript
// In src/api/server.js, comment out:
// dailyUpdateService.start();
```

### Rate Limiting

Current settings (in `PriceDataService`):
- 12 seconds between API calls (5 calls/min = 1 per 12 sec)
- Adjustable in `batchUpdateTickers()` method

### Cache Strategy

**MongoDB** (when available):
- Primary storage
- Full history per ticker
- Fast queries

**File Cache** (fallback):
- Used if MongoDB unavailable
- Same directory structure as before
- 24-hour TTL

## Troubleshooting

### "No price data available"

1. Check if ticker was initialized:
   ```javascript
   // In MongoDB, check:
   db.pricedatas.find({ ticker: "AAPL" })
   ```

2. Manually initialize:
   ```bash
   node scripts/daily-update.js AAPL
   ```

### "Rate limit exceeded"

- The service automatically respects rate limits
- If you see this error, the update will wait and retry
- Check logs for automatic backoff

### "Database not connected"

- Service falls back to file cache
- Works but less efficient
- Check MongoDB connection string

## Performance Comparison

| Scenario | Before | After |
|----------|--------|-------|
| Create portfolio (20 stocks) | 20 API calls | 20 API calls (one-time) |
| Get signals (20 stocks) | 20 API calls | 0 API calls |
| Daily updates | 20 API calls | ~2-5 API calls |
| **Monthly API usage** | ~600 calls | ~60-100 calls |

## Next Steps

1. ✅ MongoDB storage implemented
2. ✅ Daily update service created
3. ✅ Integration with routes complete
4. ⏳ Optional: Add endpoint to manually trigger updates
5. ⏳ Optional: Add monitoring/alerting for update failures

---

**Note**: This solution maintains backward compatibility. If MongoDB is unavailable, the system falls back to file-based caching.

