const express = require('express');
const { authMiddleware } = require('./auth');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const OpenAI = require('openai');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Get user portfolio
router.get('/', authMiddleware, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.userId });
    
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.userId, items: [], recommendations: [] });
      await portfolio.save();
    }

    res.json(portfolio);
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch portfolio' });
  }
});

// Add to portfolio
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { analysis, url, screenshot } = req.body;

    let portfolio = await Portfolio.findOne({ userId: req.userId });
    
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.userId, items: [], recommendations: [] });
    }

    portfolio.items.push({
      symbol: analysis.symbol,
      name: analysis.name,
      analysis,
      url,
      screenshot: screenshot?.substring(0, 100)
    });

    portfolio.updatedAt = new Date();
    await portfolio.save();

    // Generate recommendations based on portfolio
    await generateRecommendations(portfolio);

    res.json({ message: 'Added to portfolio', portfolio });
  } catch (error) {
    console.error('Portfolio add error:', error);
    res.status(500).json({ message: 'Failed to add to portfolio' });
  }
});

// Add to watchlist
router.post('/watchlist', authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.body;

    await User.findByIdAndUpdate(req.userId, {
      $addToSet: {
        watchlist: { symbol, addedAt: new Date() }
      }
    });

    res.json({ message: 'Added to watchlist' });
  } catch (error) {
    console.error('Watchlist error:', error);
    res.status(500).json({ message: 'Failed to add to watchlist' });
  }
});

// Get recommendations
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.userId });
    
    if (!portfolio || portfolio.items.length === 0) {
      return res.json({ recommendations: [] });
    }

    res.json({ recommendations: portfolio.recommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

async function generateRecommendations(portfolio) {
  if (portfolio.items.length === 0) return;

  const symbols = portfolio.items.map(item => item.symbol).filter(Boolean);
  
  if (symbols.length === 0) return;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial recommendation engine. Based on the user's portfolio of stocks, suggest related stocks they might be interested in. Return JSON array with this structure:
[
  {
    "symbol": "TICKER",
    "name": "Company Name",
    "reason": "Why this is recommended based on their portfolio",
    "confidence": 75
  }
]
Suggest 3-5 stocks that complement their existing holdings.`
        },
        {
          role: "user",
          content: `User's current portfolio includes these stocks: ${symbols.join(', ')}. 
Their recent analyses show interest in: ${portfolio.items.slice(-3).map(i => i.analysis?.signalDescription).join('; ')}
Suggest complementary stocks.`
        }
      ],
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const recommendations = JSON.parse(response.choices[0].message.content);
    
    portfolio.recommendations = (recommendations.recommendations || recommendations).map(rec => ({
      ...rec,
      basedOn: symbols.slice(-3),
      addedAt: new Date()
    }));

    await portfolio.save();
  } catch (error) {
    console.error('Recommendation generation error:', error);
  }
}

module.exports = router;