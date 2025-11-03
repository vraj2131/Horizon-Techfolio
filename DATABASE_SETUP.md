# Database Setup Guide

This guide explains how to set up MongoDB for HorizonTrader.

## Quick Start

### Option 1: Local MongoDB (Recommended for Development)

1. **Install MongoDB**
   ```bash
   # macOS
   brew install mongodb-community
   
   # Linux
   sudo apt-get install mongodb
   
   # Windows
   # Download from https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB**
   ```bash
   # macOS/Linux
   brew services start mongodb-community
   # OR
   mongod --dbpath /path/to/data
   
   # Linux (systemd)
   sudo systemctl start mongod
   ```

3. **Set Environment Variable (Optional)**
   ```bash
   export MONGODB_URI="mongodb://localhost:27017/horizontrader"
   ```

4. **Start Your App**
   ```bash
   npm start
   ```

The app will automatically connect to MongoDB. If MongoDB is not running, it will fall back to in-memory storage.

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

1. **Create Free Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free account
   - Create a new cluster (Free tier: M0)

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

3. **Set Environment Variable**
   ```bash
   export MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/horizontrader?retryWrites=true&w=majority"
   ```

4. **Start Your App**
   ```bash
   npm start
   ```

### Option 3: Docker (Quick Local Setup)

1. **Run MongoDB Container**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Start Your App**
   ```bash
   npm start
   ```

## Configuration

### Default Settings

The app uses these defaults (in `config/config.js`):
- **URI**: `mongodb://localhost:27017/horizontrader`
- **Database**: `horizontrader`
- **Required**: `false` (app works without DB)

### Environment Variables

Set these environment variables to customize:

```bash
# MongoDB connection string
export MONGODB_URI="mongodb://localhost:27017/horizontrader"

# Require database (app will fail to start if DB unavailable)
export DB_REQUIRED="false"  # or "true"
```

### Configuration File

Edit `config/config.js`:

```javascript
database: {
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/horizontrader',
  required: process.env.DB_REQUIRED !== 'true',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
}
```

## How It Works

### Database vs In-Memory Storage

The app automatically chooses the best storage method:

1. **If MongoDB is available**: Uses database (persistent storage)
2. **If MongoDB is unavailable**: Falls back to in-memory storage (data lost on restart)

This means:
- ✅ App works immediately (no DB setup required for testing)
- ✅ Can develop without MongoDB
- ✅ Production can use MongoDB for persistence

### What Gets Stored

**In MongoDB:**
- ✅ Portfolios (with all positions, cash, metadata)
- ✅ Backtest sessions (with results and metrics)
- ✅ Paper trading sessions (with trades and performance)

**Not Stored in DB (uses file cache):**
- Market data (cached to `cache/` directory)
- Technical indicator calculations (computed on-demand)

## Testing Database Connection

### Health Check

```bash
curl http://localhost:3000/health
```

Response includes database status:
```json
{
  "status": "ok",
  "service": "HorizonTrader",
  "database": {
    "connected": true,
    "status": "connected"
  },
  "timestamp": "2024-10-28T12:00:00.000Z"
}
```

### Server Startup

When you start the server, you'll see:
```
✅ MongoDB connected: mongodb://localhost:27017/horizontrader
HorizonTrader server running on http://localhost:3000
Database: ✅ Connected
```

Or if database is unavailable:
```
⚠️  Continuing without database (in-memory storage will be used)
HorizonTrader server running on http://localhost:3000
Database: ⚠️  Using in-memory storage
```

## Database Models

### Portfolio
- Stores portfolio configuration, positions, and cash
- Collection: `portfolios`
- Indexed by: `portfolioId`, `createdAt`

### BacktestSession
- Stores backtest results and metrics
- Collection: `backtestsessions`
- Indexed by: `sessionId`, `portfolioId`

### PaperTradingSession
- Stores paper trading trades and performance
- Collection: `papertradingsessions`
- Indexed by: `portfolioId`

## Troubleshooting

### "Cannot connect to MongoDB"

1. **Check if MongoDB is running:**
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mongod
   
   # Check connection
   mongosh
   ```

2. **Check connection string:**
   ```bash
   echo $MONGODB_URI
   ```

3. **Try connecting manually:**
   ```bash
   mongosh "mongodb://localhost:27017/horizontrader"
   ```

### "Database required but not available"

If `DB_REQUIRED=true` and MongoDB is unavailable, the app will fail to start.

**Solution:** Remove the requirement:
```bash
unset DB_REQUIRED
# OR
export DB_REQUIRED="false"
```

### Port Already in Use

If port 27017 is already in use:
```bash
# Find what's using the port
lsof -i :27017

# Use different port in connection string
export MONGODB_URI="mongodb://localhost:27018/horizontrader"
```

### Data Not Persisting

Check if database is actually connected:
```bash
curl http://localhost:3000/health
```

Look for `"database": { "connected": true }`

## Production Deployment

### Recommended Setup

1. **Use MongoDB Atlas** (managed cloud service)
   - Free tier available
   - Automatic backups
   - Scaling options

2. **Set Environment Variables**
   ```bash
   export MONGODB_URI="your_atlas_connection_string"
   export DB_REQUIRED="true"
   ```

3. **Enable Authentication**
   - Always use password-protected MongoDB in production
   - Use MongoDB Atlas authentication or MongoDB's built-in auth

### Security Best Practices

- ✅ Use strong database passwords
- ✅ Enable MongoDB authentication
- ✅ Use connection string with credentials (MongoDB Atlas does this)
- ✅ Restrict network access (firewall, IP whitelist)
- ✅ Use SSL/TLS connections (MongoDB Atlas defaults)

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Mongoose Documentation](https://mongoosejs.com/)

