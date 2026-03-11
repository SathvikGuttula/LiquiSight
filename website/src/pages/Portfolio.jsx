import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Portfolio() {
  const { token } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolio(response.data);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  if (loading) {
    return <div className="loading-screen">Loading portfolio...</div>;
  }

  return (
    <div className="portfolio-page">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Portfolio
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Your saved financial analyses and watchlist
        </p>
      </div>

      {/* Portfolio Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-value">{portfolio?.items?.length || 0}</div>
          <div className="stat-label">Total Assets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {portfolio?.items?.filter(i => i.analysis?.action === 'BUY').length || 0}
          </div>
          <div className="stat-label">Buy Signals</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {portfolio?.items?.filter(i => i.analysis?.action === 'SELL').length || 0}
          </div>
          <div className="stat-label">Sell Signals</div>
        </div>
      </div>

      {/* Portfolio Items */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">Holdings</h2>
        </div>

        {portfolio?.items?.length > 0 ? (
          <div className="portfolio-list">
            {portfolio.items.map((item, index) => (
              <div key={index} className="portfolio-item">
                <div className="portfolio-symbol">
                  {item.symbol?.substring(0, 2) || 'AI'}
                </div>
                <div className="portfolio-info">
                  <div className="portfolio-name">
                    {item.symbol || 'Analysis'} - {item.name || 'Financial Asset'}
                  </div>
                  <div className="portfolio-meta">
                    Confidence: {item.analysis?.confidence || 0}% | Risk: {item.analysis?.riskLevel || 'N/A'}/5
                    {' | '}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`portfolio-signal signal-${item.analysis?.action?.toLowerCase() || 'hold'}`}>
                  {item.analysis?.action || 'HOLD'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </div>
            <h3 className="empty-state-title">No Portfolio Items</h3>
            <p className="empty-state-text">
              Use the LiquiSight extension to analyze charts and add them to your portfolio
            </p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {portfolio?.recommendations?.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">AI Recommendations</h2>
          </div>
          {portfolio.recommendations.map((rec, index) => (
            <div key={index} className="recommendation-card">
              <div className="recommendation-header">
                <span className="recommendation-symbol">{rec.symbol}</span>
                <span className="recommendation-name">{rec.name}</span>
              </div>
              <p className="recommendation-reason">{rec.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Portfolio;
