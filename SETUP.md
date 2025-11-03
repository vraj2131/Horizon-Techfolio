# Quick Setup Guide for Team Members

## Prerequisites
- Node.js 14.0.0 or higher
- MongoDB Atlas account (cloud database - free tier available)

## Setup Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Horizon-Techfolio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# MongoDB Atlas Connection String
# Get this from MongoDB Atlas dashboard (Connect > Connect your application)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/horizontrader?retryWrites=true&w=majority

# Alpha Vantage API Key (get free key from https://www.alphavantage.co/support/#api-key)
ALPHA_VANTAGE_API_KEY=your_api_key_here

# Optional: Require database connection
DB_REQUIRED=false
```

**Important:** 
- Replace `<username>` and `<password>` with your MongoDB Atlas credentials
- Replace `cluster0.xxxxx` with your actual cluster address
- The `.env` file is already in `.gitignore` - DO NOT commit your credentials!

### 4. Get MongoDB Atlas Credentials

If you don't have access yet, ask your team lead for:
- MongoDB Atlas connection string, OR
- MongoDB Atlas username/password + cluster address

### 5. Start the Server
```bash
npm start
```

You should see:
```
✅ MongoDB connected: mongodb+srv://***@cluster0.xxxxx.mongodb.net/horizontrader
HorizonTrader server running on http://localhost:3000
Database: ✅ Connected
```

### 6. Test the Setup

```bash
# Health check
curl http://localhost:3000/health

# Should return database status
```

## Troubleshooting

### "Cannot connect to MongoDB"
- Check your `.env` file has the correct `MONGODB_URI`
- Verify your IP address is whitelisted in MongoDB Atlas Network Access
- Check your username/password are correct

### "Database not connected"
- The app will still work with in-memory storage
- Check MongoDB Atlas connection string format
- Make sure network access allows your IP address

## For Team Leads

### Sharing MongoDB Atlas Access

**Option 1: Share Connection String** (Easiest)
- Provide the connection string with a shared username/password
- Team members add it to their `.env` file

**Option 2: Individual Accounts** (More Secure)
- Create individual database users in MongoDB Atlas
- Each team member uses their own credentials
- Better for tracking and security

### Setting Up MongoDB Atlas

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed MongoDB Atlas setup instructions.

