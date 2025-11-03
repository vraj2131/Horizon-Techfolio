/**
 * Mongoose model for storing historical price data
 * Stores full price history per ticker to minimize API calls
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const PricePointSchema = new Schema({
  date: { type: String, required: true },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, required: true }
}, { _id: false });

const PriceDataSchema = new Schema({
  ticker: { type: String, required: true, unique: true },
  interval: { type: String, default: 'daily' },
  data: [PricePointSchema], // Full historical data
  firstDate: String, // First date in the dataset
  lastDate: String, // Last date in the dataset (for quick checking)
  lastUpdated: { type: Date, default: Date.now },
  totalDataPoints: { type: Number, default: 0 }
}, {
  timestamps: false
});

// Create indexes for faster queries
// Note: ticker already has unique: true (creates index automatically)
PriceDataSchema.index({ lastDate: -1 });
PriceDataSchema.index({ lastUpdated: -1 });

// Instance method to get data for a date range
PriceDataSchema.methods.getDateRange = function(startDate, endDate) {
  return this.data.filter(point => {
    return point.date >= startDate && point.date <= endDate;
  });
};

// Instance method to check if data needs update
PriceDataSchema.methods.needsUpdate = function() {
  const today = new Date();
  const lastUpdate = new Date(this.lastUpdated);
  const daysSinceUpdate = (today - lastUpdate) / (1000 * 60 * 60 * 24);
  
  // Update if more than 1 day old (data updates at end of trading day)
  return daysSinceUpdate > 1;
};

const PriceDataModel = mongoose.model('PriceData', PriceDataSchema);

module.exports = PriceDataModel;

