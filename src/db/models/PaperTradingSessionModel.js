/**
 * Mongoose model for PaperTradingSession persistence
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaperTradeSchema = new Schema({
  ticker: { type: String, required: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  shares: { type: Number, required: true },
  price: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const PaperTradingSessionSchema = new Schema({
  portfolioId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'paused', 'stopped'], default: 'active' },
  initialValue: { type: Number, default: 100000 },
  currentValue: { type: Number, default: 100000 },
  totalReturn: { type: Number, default: 0 },
  dailyReturn: { type: Number, default: 0 },
  paperTrades: [PaperTradeSchema],
  performance: {
    currentValue: Number,
    totalReturn: Number,
    dailyReturn: Number,
    sharpeRatio: Number,
    maxDrawdown: Number
  },
  startedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: false
});

// Create indexes for better query performance
// Note: portfolioId already has unique: true (creates index automatically)
PaperTradingSessionSchema.index({ status: 1 });
PaperTradingSessionSchema.index({ startedAt: -1 });

const PaperTradingSessionModel = mongoose.model('PaperTradingSession', PaperTradingSessionSchema);

module.exports = PaperTradingSessionModel;

