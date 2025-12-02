/**
 * Mongoose model for Portfolio persistence
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const PositionSchema = new Schema({
  ticker: { type: String, required: true },
  side: { type: String, enum: ['long', 'short'], default: 'long' },
  quantity: { type: Number, default: 0 }, // Number of shares held (renamed from 'shares' for consistency)
  shares: { type: Number, default: 0 }, // Kept for backward compatibility
  averageCost: { type: Number, default: 0 }, // Average cost per share (renamed from 'avg_cost')
  avg_cost: { type: Number, default: 0 }, // Kept for backward compatibility
  currentPrice: { type: Number, default: 0 }, // Current market price per share
  marketValue: { type: Number, default: 0 }, // Total market value (quantity * currentPrice)
  profitLoss: { type: Number, default: 0 }, // Unrealized P&L in dollars
  profitLossPercent: { type: Number, default: 0 }, // Unrealized P&L in percentage
  pnl_unrealized: { type: Number, default: 0 } // Kept for backward compatibility
}, { _id: false });

const SecuritySchema = new Schema({
  ticker: { type: String, required: true },
  name: String,
  exchange: String,
  sector: String,
  inception_date: String
}, { _id: false });

const PortfolioSchema = new Schema({
  portfolioId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true }, // Link portfolio to user
  name: { type: String, default: null }, // Portfolio name (optional)
  horizon: { type: Number, required: true, enum: [1, 2, 5] },
  cash: { type: Number, default: 100000 },
  initialCapital: { type: Number, default: null }, // Original investment amount (tracked separately from cash)
  risk_budget: { type: Number, default: 1.0 },
  securities: [SecuritySchema],
  positions: [PositionSchema],
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: false // We're managing createdAt/lastUpdated manually
});

// Create indexes for better query performance
// Note: portfolioId already has unique: true (creates index automatically)
PortfolioSchema.index({ createdAt: -1 });

// Pre-save middleware to sync backward compatibility fields
PortfolioSchema.pre('save', function(next) {
  // Sync quantity/shares and averageCost/avg_cost for each position
  if (this.positions && this.positions.length > 0) {
    this.positions.forEach(position => {
      // Sync quantity with shares (quantity is primary)
      if (position.quantity && !position.shares) {
        position.shares = position.quantity;
      } else if (position.shares && !position.quantity) {
        position.quantity = position.shares;
      }
      
      // Sync averageCost with avg_cost (averageCost is primary)
      if (position.averageCost && !position.avg_cost) {
        position.avg_cost = position.averageCost;
      } else if (position.avg_cost && !position.averageCost) {
        position.averageCost = position.avg_cost;
      }
      
      // Sync profitLoss with pnl_unrealized (profitLoss is primary)
      if (position.profitLoss && !position.pnl_unrealized) {
        position.pnl_unrealized = position.profitLoss;
      } else if (position.pnl_unrealized && !position.profitLoss) {
        position.profitLoss = position.pnl_unrealized;
      }
    });
  }
  next();
});

// Instance method to convert to Portfolio object format
PortfolioSchema.methods.toPortfolioObject = function() {
  return {
    portfolioId: this.portfolioId,
    userId: this.userId,
    horizon: this.horizon,
    cash: this.cash,
    risk_budget: this.risk_budget,
    securities: this.securities,
    positions: this.positions,
    createdAt: this.createdAt,
    lastUpdated: this.lastUpdated
  };
};

const PortfolioModel = mongoose.model('Portfolio', PortfolioSchema);

module.exports = PortfolioModel;



