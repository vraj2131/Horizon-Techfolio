# Environment Variables Setup Guide

This project uses `.env` files to store sensitive configuration that should NOT be committed to GitHub.

## ✅ What's Protected

The following files are in `.gitignore` and will NOT be committed:
- `.env` - Your actual credentials (NEVER commit this!)
- `.env.local` - Local overrides
- `.env.*.local` - Local environment-specific overrides

## ✅ What's Safe to Commit

- `.env.example` - Template file with placeholder values (safe to commit)

## Setup Instructions

### Step 1: Create Your .env File

Copy the example file and fill in your actual values:

```bash
cp .env.example .env
```

### Step 2: Edit .env with Your Credentials

Open `.env` in your editor and replace the placeholders:

```bash
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/horizontrader?retryWrites=true&w=majority

# Alpha Vantage API Key
ALPHA_VANTAGE_API_KEY=your_actual_api_key_here

# Database Configuration
DB_REQUIRED=false
```

### Step 3: Important Notes

1. **URL-encode special characters in MongoDB password:**
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `%` becomes `%25`
   - etc.

2. **No quotes needed** (usually):
   ```bash
   # Good
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
   
   # Also works (with quotes)
   MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/db"
   ```

3. **No spaces around `=`**:
   ```bash
   # Good
   KEY=value
   
   # Bad
   KEY = value
   ```

## Required Environment Variables

### MONGODB_URI (Required for database features)

Your MongoDB Atlas connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/horizontrader?retryWrites=true&w=majority
```

**To get this:**
1. Go to MongoDB Atlas dashboard
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<username>` and `<password>`
6. Add `/horizontrader` before the `?` (database name)

### ALPHA_VANTAGE_API_KEY (Required for market data)

Your Alpha Vantage API key:
```
ALPHA_VANTAGE_API_KEY=your_key_here
```

**To get this:**
1. Go to https://www.alphavantage.co/support/#api-key
2. Sign up for free account
3. Copy your API key

**Free tier limits:**
- 5 API calls per minute
- 500 API calls per day

### Multiple API Keys (Optional - for automatic rotation)

You can add multiple API keys to automatically rotate when rate limits are hit:
```
ALPHA_VANTAGE_API_KEY=your_primary_key_here
ALPHA_VANTAGE_API_KEY_2=your_secondary_key_here
ALPHA_VANTAGE_API_KEY_3=your_tertiary_key_here
```

**How it works:**
- The system automatically switches to the next available key when rate limits are detected
- Each key is tracked separately (5 calls/min, 500/day)
- With 2 keys, you effectively get 10 calls/min and 1000/day
- Rotation is automatic - no manual intervention needed

**Enable/disable rotation:**
```
ENABLE_KEY_ROTATION=true   # Enable automatic rotation (default)
ENABLE_KEY_ROTATION=false  # Disable rotation (use only primary key)
```

### DB_REQUIRED (Optional)

Whether the app should fail if database is unavailable:
```bash
DB_REQUIRED=false  # App works without DB (uses in-memory storage)
DB_REQUIRED=true   # App fails if DB unavailable
```

**Default:** `false` (recommended for development)

### PORT (Optional)

Server port:
```bash
PORT=3000
```

**Default:** `3000`

### HOST (Optional)

Server host:
```bash
HOST=localhost
```

**Default:** `localhost`

## Verifying Your Setup

### Check if .env is loaded:

```bash
# Start the server - it should use values from .env
npm start
```

You should see:
```
✅ MongoDB connected: mongodb+srv://***@cluster0.xxxxx.mongodb.net/horizontrader
```

### Test manually:

```bash
# Load .env and check variables
node -e "require('dotenv').config(); console.log('MongoDB:', process.env.MONGODB_URI ? 'Set' : 'Not set'); console.log('API Key:', process.env.ALPHA_VANTAGE_API_KEY ? 'Set' : 'Not set');"
```

## Sharing with Team Members

### For Team Members:

1. **Get the connection string from team lead** (via secure channel, not GitHub!)
2. **Copy `.env.example` to `.env`**:
   ```bash
   cp .env.example .env
   ```
3. **Edit `.env` with the shared credentials**
4. **Or ask team lead for MongoDB Atlas database access** (individual accounts are more secure)

### For Team Leads:

**Option 1: Share connection string** (easiest)
- Provide MongoDB connection string securely (Slack DM, email, etc.)
- Team members add it to their `.env` file

**Option 2: Individual database users** (more secure)
- Create separate MongoDB users for each team member
- Each person uses their own credentials
- Better for tracking and security

## Security Best Practices

### ✅ DO:
- Use `.env` file for all sensitive data
- Keep `.env` in `.gitignore` (already done)
- Share `.env.example` as template
- Use secure channels to share credentials
- Rotate passwords/API keys periodically

### ❌ DON'T:
- Commit `.env` to Git (it's in `.gitignore`, but double-check!)
- Share credentials in GitHub issues/comments
- Put credentials in code
- Use same credentials in production as development

## Troubleshooting

### ".env file not loading"

1. **Check file exists:**
   ```bash
   ls -la .env
   ```

2. **Check location:** `.env` must be in project root (same directory as `package.json`)

3. **Check syntax:** No spaces around `=`, no typos in variable names

4. **Verify dotenv is installed:**
   ```bash
   npm list dotenv
   ```

### "MongoDB connection fails"

1. **Check MONGODB_URI is set:**
   ```bash
   echo $MONGODB_URI
   # Should show your connection string
   ```

2. **Check password encoding:**
   - Special characters must be URL-encoded
   - `@` → `%40`

3. **Check MongoDB Atlas network access:**
   - Your IP address must be whitelisted

### "API key not working"

1. **Verify key is correct:**
   ```bash
   echo $ALPHA_VANTAGE_API_KEY
   ```

2. **Check rate limits:**
   - Free tier: 5 calls/min, 500/day
   - You might have hit the limit

3. **Get new key:**
   - Go to Alpha Vantage dashboard
   - Generate new API key if needed

## Example .env File

```bash
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://and179:Ayush%4026@cluster0.bogoylw.mongodb.net/horizontrader?retryWrites=true&w=majority

# Alpha Vantage API Key
ALPHA_VANTAGE_API_KEY=MN2S749NU20S4XMU

# Database Configuration
DB_REQUIRED=false

# Server Configuration (optional)
PORT=3000
HOST=localhost
```

---

**Remember:** Never commit your `.env` file to Git! It's already in `.gitignore`, but always double-check before pushing.

