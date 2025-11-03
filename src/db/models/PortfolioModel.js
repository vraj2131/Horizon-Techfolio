/**
 * Mongoose model for Portfolio persistence
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const PositionSchema = new Schema({
  ticker: { type: String, required: true },
  side: { type: String, enum: ['long', 'short'], default: 'long' },
  shares: { type: Number, default: 0 },
  avg_cost: { type: Number, default: 0 },
  pnl_unrealized: { type: Number, default: 0 }
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
  horizon: { type: Number, required: true, enum: [1, 2, 5] },
  cash: { type: Number, default: 100000 },
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

