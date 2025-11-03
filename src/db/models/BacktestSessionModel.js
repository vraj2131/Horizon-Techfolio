/**
 * Mongoose model for BacktestSession persistence
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const BacktestSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  portfolioId: { type: String, required: true, index: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  strategy: String,
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  metrics: {
    cagr: Number,
    sharpe: Number,
    maxDrawdown: Number,
    totalReturn: Number,
    winRate: Number,
    totalTrades: Number
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
}, {
  timestamps: false
});

// Create indexes for better query performance
// Note: sessionId already has unique: true (creates index automatically)
// Note: portfolioId already has index: true in schema definition
BacktestSessionSchema.index({ createdAt: -1 });

const BacktestSessionModel = mongoose.model('BacktestSession', BacktestSessionSchema);

module.exports = BacktestSessionModel;

