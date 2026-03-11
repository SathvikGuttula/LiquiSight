require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const analysisRoutes = require('./routes/analysis');
const portfolioRoutes = require('./routes/portfolio');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['chrome-extension://*', 'http://localhost:3000', 'https://liqui-sight.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'LiquiSight API' });
});

// Connect to MongoDB (non-blocking — server starts even if DB is unavailable)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/liqui-sight', {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('📦 Connected to MongoDB'))
  .catch(err => console.warn('⚠️ MongoDB connection failed:', err.message, '— server running without database'));

app.listen(PORT, () => {
  console.log(`🚀 LiquiSight API running on port ${PORT}`);
});