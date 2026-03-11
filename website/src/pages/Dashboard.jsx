import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Dashboard() {
  const { user, token } = useAuth();
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
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Your AI-powered financial insights dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{portfolio?.items?.length || 0}</div>
          <div className="stat-label">Portfolio Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{portfolio?.recommendations?.length || 0}</div>
          <div className="stat-label">Recommendations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user?.stats?.totalScans || 0}</div>
          <div className="stat-label">Total Scans</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {portfolio?.items?.filter(i => i.analysis?.action === 'BUY').length || 0}
          </div>
          <div className="stat-label">Buy Signals</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Portfolio */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📊 Recent Analysis</h2>
            <Link to="/portfolio" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              View All
            </Link>
          </div>
          
          {portfolio?.items?.length > 0 ? (
            <div className="portfolio-list">
              {portfolio.items.slice(-5).reverse().map((item, index) => (
                <div key={index} className="portfolio-item">
                  <div className="portfolio-symbol">
                    {item.symbol?.substring(0, 2) || 'AI'}
                  </div>
                  <div className="portfolio-info">
                    <div className="portfolio-name">{item.symbol || 'Analysis'}</div>
                    <div className="portfolio-meta">
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
                  <path d="M3 17l6-6 4 4 8-8"/>
                  <path d="M17 7h4v4"/>
                </svg>
              </div>
              <h3 className="empty-state-title">No Analysis Yet</h3>
              <p className="empty-state-text">
                Use the LiquiSight extension to analyze charts
              </p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">💡 AI Recommendations</h2>
          </div>
          
          {portfolio?.recommendations?.length > 0 ? (
            <div>
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
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 className="empty-state-title">No Recommendations Yet</h3>
              <p className="empty-state-text">
                Add stocks to get personalized suggestions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">🚀 Quick Actions</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            Open Extension
          </button>
          <Link to="/portfolio" className="btn btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
            View Portfolio
          </Link>
          <Link to="/history" className="btn btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            Analysis History
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;