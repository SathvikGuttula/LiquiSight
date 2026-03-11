const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    symbol: String,
    name: String,
    analysis: {
      signal: String,
      action: String,
      confidence: Number,
      signalDescription: String,
      trendAnalysis: String,
      volatility: String,
      riskLevel: Number,
      risks: [String],
      priceTarget: String,
      supportLevel: String,
      resistanceLevel: String
    },
    url: String,
    screenshot: String,
    createdAt: { type: Date, default: Date.now }
  }],
  recommendations: [{
    symbol: String,
    name: String,
    reason: String,
    basedOn: [String],
    confidence: Number,
    addedAt: { type: Date, default: Date.now }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Portfolio', portfolioSchema);