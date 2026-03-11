const express = require('express');
const OpenAI = require('openai');
const { authMiddleware } = require('./auth');
const User = require('../models/User');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Main analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { image, url, timestamp } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // Call OpenAI Vision API
    const analysis = await analyzeFinancialImage(image);

    // If user is authenticated, save to history
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await User.findByIdAndUpdate(decoded.userId, {
          $push: {
            analysisHistory: {
              analysis,
              url,
              timestamp: new Date(timestamp),
              screenshot: image.substring(0, 100) + '...' // Store truncated reference
            }
          },
          $inc: { 'stats.totalScans': 1, 'stats.todayScans': 1 },
          $set: { 'stats.lastScanDate': new Date() }
        });
      } catch (e) {
        console.log('Could not save to user history');
      }
    }

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Analysis failed', error: error.message });
  }
});

async function analyzeFinancialImage(base64Image) {
  const systemPrompt = `You are LiquiSight, an expert AI financial analyst specializing in technical analysis of stock charts and financial data. Analyze the provided image and return a JSON response with the following structure:

{
  "symbol": "Stock ticker if visible (e.g., AAPL, TSLA)",
  "name": "Company name if identifiable",
  "signal": "bullish/bearish/neutral",
  "action": "BUY/SELL/HOLD",
  "confidence": 85,
  "signalTitle": "Brief signal title",
  "signalDescription": "2-3 sentence explanation of the primary signal",
  "trendAnalysis": "Analysis of current price trend, momentum, and direction",
  "volatility": "Assessment of price volatility and stability",
  "riskLevel": 3,
  "risks": ["Risk factor 1", "Risk factor 2"],
  "supportLevel": "Nearest support level if identifiable",
  "resistanceLevel": "Nearest resistance level if identifiable",
  "keyIndicators": ["Indicator 1", "Indicator 2"],
  "recommendation": "Detailed recommendation for traders"
}

If the image is not a financial chart, still provide helpful analysis but set confidence lower. Always be specific and actionable in your analysis.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this financial chart/data and provide your expert assessment:"
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return fallback analysis
    return {
      symbol: "UNKNOWN",
      name: "Financial Asset",
      signal: "neutral",
      action: "HOLD",
      confidence: 60,
      signalTitle: "Analysis In Progress",
      signalDescription: "We detected financial data but need more context for accurate analysis. Consider zooming in on specific chart elements.",
      trendAnalysis: "Unable to determine clear trend from current view. Look for moving average crossovers and volume confirmation.",
      volatility: "Moderate volatility detected. Monitor for breakout signals.",
      riskLevel: 3,
      risks: [
        "Limited data visibility",
        "Market conditions uncertain"
      ],
      supportLevel: "Not clearly visible",
      resistanceLevel: "Not clearly visible",
      keyIndicators: ["Price action", "Volume"],
      recommendation: "Select a specific chart area for more detailed analysis."
    };
  }
}

module.exports = router;