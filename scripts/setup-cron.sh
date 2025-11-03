#!/bin/bash
# Setup cron job for daily price data updates
# This script helps you set up a cron job to automatically update price data

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔄 Setting up cron job for daily price updates..."
echo ""
echo "Project directory: $PROJECT_DIR"
echo "Update script: $SCRIPT_DIR/daily-update.js"
echo ""

# Get the absolute path to Node.js
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "❌ Error: Node.js not found in PATH"
    echo "Please ensure Node.js is installed and in your PATH"
    exit 1
fi

echo "Node.js path: $NODE_PATH"
echo ""

# Create the cron command
CRON_CMD="cd $PROJECT_DIR && $NODE_PATH $SCRIPT_DIR/daily-update.js >> $PROJECT_DIR/logs/daily-update.log 2>&1"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

echo "📋 Recommended cron schedule options:"
echo ""
echo "1. Daily at 5:00 PM ET (after market close) - Weekdays only:"
echo "   0 21 * * 1-5 $CRON_CMD"
echo ""
echo "2. Daily at 6:00 PM ET (safer, after market definitely closed):"
echo "   0 22 * * 1-5 $CRON_CMD"
echo ""
echo "3. Daily at midnight (UTC):"
echo "   0 0 * * * $CRON_CMD"
echo ""
echo "4. Every hour during market hours (9:30 AM - 4:00 PM ET):"
echo "   30 9-16 * * 1-5 $CRON_CMD"
echo ""
echo "5. Every 4 hours:"
echo "   0 */4 * * * $CRON_CMD"
echo ""

read -p "Do you want to add a cron job? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Select schedule option (1-5) or enter custom (c): "
    read -r schedule_choice
    
    case $schedule_choice in
        1)
            CRON_SCHEDULE="0 21 * * 1-5"
            ;;
        2)
            CRON_SCHEDULE="0 22 * * 1-5"
            ;;
        3)
            CRON_SCHEDULE="0 0 * * *"
            ;;
        4)
            CRON_SCHEDULE="30 9-16 * * 1-5"
            ;;
        5)
            CRON_SCHEDULE="0 */4 * * *"
            ;;
        c|C)
            echo "Enter custom cron schedule (format: minute hour day month weekday): "
            read -r CRON_SCHEDULE
            ;;
        *)
            echo "Invalid choice, using option 2 (daily at 6 PM ET, weekdays)"
            CRON_SCHEDULE="0 22 * * 1-5"
            ;;
    esac
    
    CRON_LINE="$CRON_SCHEDULE $CRON_CMD"
    
    echo ""
    echo "Adding cron job:"
    echo "$CRON_LINE"
    echo ""
    
    # Check if cron job already exists
    (crontab -l 2>/dev/null | grep -q "daily-update.js") && {
        echo "⚠️  Cron job already exists. Removing old entry..."
        crontab -l 2>/dev/null | grep -v "daily-update.js" | crontab -
    }
    
    # Add new cron job
    (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
    
    echo "✅ Cron job added successfully!"
    echo ""
    echo "Current crontab:"
    crontab -l | grep "daily-update.js"
    echo ""
    echo "📝 Logs will be written to: $PROJECT_DIR/logs/daily-update.log"
    echo ""
    echo "To view cron logs: tail -f $PROJECT_DIR/logs/daily-update.log"
    echo "To remove cron job: crontab -e (then delete the line)"
else
    echo ""
    echo "To add manually, run: crontab -e"
    echo "Then add this line:"
    echo "$CRON_CMD"
    echo ""
    echo "Or use one of the recommended schedules above"
fi

