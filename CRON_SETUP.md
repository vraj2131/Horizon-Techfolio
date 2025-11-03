# Cron Job Setup for Daily Price Updates

This guide shows you how to set up automatic daily updates for stock price data using cron.

## Quick Setup (Automated)

Run the setup script:

```bash
chmod +x scripts/setup-cron.sh
./scripts/setup-cron.sh
```

The script will:
- Find your project directory
- Find Node.js path
- Let you choose a schedule
- Automatically add the cron job

## Manual Setup

### Step 1: Open Crontab

```bash
crontab -e
```

### Step 2: Add Cron Job

Add one of these lines (adjust the path to your project):

#### Option 1: Daily at 5:00 PM ET (After Market Close) - Weekdays Only
```bash
0 21 * * 1-5 cd /Users/ayush/Documents/Horizon\ Trading && /usr/local/bin/node scripts/daily-update.js >> logs/daily-update.log 2>&1
```

#### Option 2: Daily at 6:00 PM ET (Safer, Market Definitely Closed)
```bash
0 22 * * 1-5 cd /Users/ayush/Documents/Horizon\ Trading && /usr/local/bin/node scripts/daily-update.js >> logs/daily-update.log 2>&1
```

#### Option 3: Every Hour During Market Hours (9:30 AM - 4:00 PM ET)
```bash
30 9-16 * * 1-5 cd /Users/ayush/Documents/Horizon\ Trading && /usr/local/bin/node scripts/daily-update.js >> logs/daily-update.log 2>&1
```

### Step 3: Find Your Node.js Path

```bash
which node
# Output example: /usr/local/bin/node or /opt/homebrew/bin/node
```

### Step 4: Update the Cron Command

Replace `/usr/local/bin/node` with your actual Node.js path.

### Step 5: Create Logs Directory

```bash
mkdir -p logs
```

## Cron Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, where 0 and 7 = Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

### Examples

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Daily at 5 PM ET (weekdays) | `0 21 * * 1-5` | Market close + 30 min buffer |
| Daily at 6 PM ET (weekdays) | `0 22 * * 1-5` | Safe time after market close |
| Every hour (market hours) | `30 9-16 * * 1-5` | 9:30 AM - 4:30 PM ET |
| Every 4 hours | `0 */4 * * *` | 4 times per day |
| Every 12 hours | `0 */12 * * *` | Twice per day |
| Every day at midnight | `0 0 * * *` | UTC midnight |

## Important Notes

### Market Hours
- **US Market Hours**: 9:30 AM - 4:00 PM ET
- **Market Close**: 4:00 PM ET
- **Alpha Vantage Updates**: End of trading day (usually 4:00-5:00 PM ET)
- **Best Update Time**: 5:00-6:00 PM ET (after market closes)

### Time Zone Considerations

**macOS/Linux cron uses system time zone:**
- ET = Eastern Time (UTC-5 or UTC-4 with DST)
- 5:00 PM ET = `21:00` (9 PM) in cron (if system is in UTC)
- 5:00 PM ET = `17:00` (5 PM) in cron (if system is in ET)

**Check your system timezone:**
```bash
date
# Or
timedatectl  # Linux only
```

**To use ET time in cron (macOS):**
```bash
# Set TZ environment variable in cron
TZ=America/New_York
0 17 * * 1-5 cd /path/to/project && node scripts/daily-update.js
```

## Environment Variables

The cron job needs access to your MongoDB connection string. You have two options:

### Option 1: Set in Cron Job (Recommended)

```bash
0 22 * * 1-5 cd /Users/ayush/Documents/Horizon\ Trading && MONGODB_URI="mongodb+srv://..." node scripts/daily-update.js >> logs/daily-update.log 2>&1
```

### Option 2: Use .env File

The script automatically loads `.env` file if it exists. Make sure the path is correct in cron:

```bash
0 22 * * 1-5 cd /Users/ayush/Documents/Horizon\ Trading && node scripts/daily-update.js >> logs/daily-update.log 2>&1
```

## Verify Cron Job

### View Your Cron Jobs

```bash
crontab -l
```

You should see your daily-update.js entry.

### Check Cron Logs

```bash
tail -f logs/daily-update.log
```

### Test Cron Job Manually

```bash
cd /Users/ayush/Documents/Horizon\ Trading
node scripts/daily-update.js
```

### Check if Cron is Running (Linux)

```bash
sudo systemctl status cron
# Or
sudo service cron status
```

### Check Cron Logs (System Logs)

```bash
# macOS
log show --predicate 'process == "cron"' --last 1h

# Linux
grep CRON /var/log/syslog
```

## Troubleshooting

### Cron Job Not Running

1. **Check cron service is running:**
   ```bash
   # macOS - cron is built-in, check if it's enabled
   sudo launchctl list | grep cron
   
   # Linux
   sudo systemctl status cron
   ```

2. **Check cron permissions:**
   ```bash
   # Make sure script is executable
   chmod +x scripts/daily-update.js
   ```

3. **Check environment variables:**
   Cron runs with minimal environment. Use full paths:
   ```bash
   # Good
   /usr/local/bin/node /full/path/to/script.js
   
   # Bad
   node script.js  # May not work
   ```

4. **Check log file permissions:**
   ```bash
   mkdir -p logs
   chmod 755 logs
   ```

### "Command not found" Error

Use full paths in cron:
```bash
# Find paths
which node
which npm

# Use in cron
/usr/local/bin/node /path/to/scripts/daily-update.js
```

### "Cannot connect to MongoDB" Error

Make sure `MONGODB_URI` is set:
```bash
# In cron job, set environment variable:
MONGODB_URI="mongodb+srv://..." /usr/local/bin/node scripts/daily-update.js
```

### Cron Job Runs But No Updates

1. Check the log file:
   ```bash
   cat logs/daily-update.log
   ```

2. Verify MongoDB connection:
   ```bash
   # Test connection manually
   node scripts/daily-update.js AAPL
   ```

3. Check if tickers need updates:
   ```bash
   # The service only updates if data is >1 day old
   # Force update by checking MongoDB lastUpdated field
   ```

## Remove Cron Job

```bash
# Edit crontab
crontab -e

# Delete the line with daily-update.js
# Save and exit
```

Or use the script:
```bash
crontab -l | grep -v "daily-update.js" | crontab -
```

## Advanced: Multiple Schedules

You can set up multiple cron jobs for different purposes:

```bash
# Daily full update at 6 PM
0 22 * * 1-5 cd /path && node scripts/daily-update.js >> logs/daily.log 2>&1

# Hourly check during market hours (only if needed)
30 9-16 * * 1-5 cd /path && node scripts/daily-update.js >> logs/hourly.log 2>&1
```

## Security Note

**Never commit sensitive data:**
- MongoDB connection strings with passwords
- API keys
- Use environment variables or `.env` file (already in `.gitignore`)

## Alternative: Systemd Timer (Linux)

If you're on Linux, you can use systemd timers instead of cron:

```bash
# Create timer file: /etc/systemd/system/daily-update.timer
[Unit]
Description=Daily Price Data Update Timer

[Timer]
OnCalendar=Mon-Fri 22:00
Persistent=true

[Install]
WantedBy=timers.target
```

## Summary

**Recommended Setup:**
1. Run `./scripts/setup-cron.sh` (automated)
2. Or manually: `crontab -e` → Add schedule
3. Schedule: `0 22 * * 1-5` (6 PM ET, weekdays)
4. Monitor: `tail -f logs/daily-update.log`

**Result:**
- Automatic daily updates after market close
- No manual intervention needed
- Shared database benefits entire team

