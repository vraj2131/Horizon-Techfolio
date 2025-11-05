#!/bin/bash
# Setup cron job for daily price data updates
# Runs daily at 6:00 PM (after US market close at 4 PM EST)

PROJECT_DIR="/Users/ayush/Documents/Horizon Trading"
NODE_PATH=$(which node)
CRON_SCRIPT="$PROJECT_DIR/scripts/daily-update.js"
LOG_FILE="$PROJECT_DIR/logs/cron-update.log"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Create the cron job command
# Format: minute hour day month weekday command
# 0 18 * * 1-5 means: At 6:00 PM, Monday through Friday
CRON_JOB="0 18 * * 1-5 cd \"$PROJECT_DIR\" && $NODE_PATH $CRON_SCRIPT >> $LOG_FILE 2>&1"

echo "════════════════════════════════════════════════════════"
echo "📅 HorizonTrader Daily Update Cron Job Setup"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Project Directory: $PROJECT_DIR"
echo "Node Path: $NODE_PATH"
echo "Script: $CRON_SCRIPT"
echo "Log File: $LOG_FILE"
echo ""
echo "Schedule: Daily at 6:00 PM (Monday-Friday)"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "daily-update.js"; then
  echo "⚠️  Cron job already exists!"
  echo ""
  echo "Current cron job:"
  crontab -l 2>/dev/null | grep "daily-update.js"
  echo ""
  read -p "Do you want to replace it? (y/n): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Installation cancelled"
    exit 0
  fi
  
  # Remove old cron job
  crontab -l 2>/dev/null | grep -v "daily-update.js" | crontab -
  echo "🗑️  Removed old cron job"
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "✅ Cron job installed successfully!"
echo ""
echo "════════════════════════════════════════════════════════"
echo "📋 Verification"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Current cron jobs:"
crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$"
echo ""
echo "════════════════════════════════════════════════════════"
echo "🔧 Management Commands"
echo "════════════════════════════════════════════════════════"
echo ""
echo "View cron jobs:    crontab -l"
echo "Edit cron jobs:    crontab -e"
echo "Remove cron job:   crontab -r"
echo "View logs:         tail -f $LOG_FILE"
echo "Test manually:     npm run update-prices"
echo ""
echo "════════════════════════════════════════════════════════"
echo "💡 Notes"
echo "════════════════════════════════════════════════════════"
echo ""
echo "- Cron runs daily at 6:00 PM (Monday-Friday)"
echo "- US market closes at 4:00 PM EST, data available ~1 hour later"
echo "- Logs are written to: $LOG_FILE"
echo "- Server also updates automatically when running"
echo "- Both mechanisms work independently"
echo ""
echo "🎉 Setup complete!"
echo ""
