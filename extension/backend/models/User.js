const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  portfolio: [{
    symbol: String,
    analysis: Object,
    addedAt: { type: Date, default: Date.now }
  }],
  watchlist: [{
    symbol: String,
    addedAt: { type: Date, default: Date.now }
  }],
  analysisHistory: [{
    analysis: Object,
    url: String,
    timestamp: Date,
    screenshot: String
  }],
  stats: {
    totalScans: { type: Number, default: 0 },
    todayScans: { type: Number, default: 0 },
    lastScanDate: Date
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);