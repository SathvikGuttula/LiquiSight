import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function History() {
  const { user, token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.user?.analysisHistory || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return <div className="loading-screen">Loading history...</div>;
  }

  return (
    <div className="history-page">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Analysis History
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Your past AI-powered financial analyses
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">Total Analyses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user?.stats?.todayScans || 0}</div>
          <div className="stat-label">Today's Scans</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {user?.stats?.lastScanDate 
              ? new Date(user.stats.lastScanDate).toLocaleDateString() 
              : 'Never'}
          </div>
          <div className="stat-label">Last Scan</div>
        </div>
      </div>

      {/* History List */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">Recent Analyses</h2>
        </div>

        {history.length > 0 ? (
          <div className="portfolio-list">
            {history.slice().reverse().map((item, index) => (
              <div key={index} className="portfolio-item">
                <div className="portfolio-symbol">
                  {item.analysis?.symbol?.substring(0, 2) || 'AI'}
                </div>
                <div className="portfolio-info">
                  <div className="portfolio-name">
                    {item.analysis?.symbol || 'Analysis'} - {item.analysis?.name || 'Financial Data'}
                  </div>
                  <div className="portfolio-meta">
                    {item.analysis?.signalDescription?.substring(0, 80) || 'AI Analysis'}
                    {item.analysis?.signalDescription?.length > 80 ? '...' : ''}
                  </div>
                  <div className="portfolio-meta" style={{ marginTop: '4px' }}>
                    {item.url && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '12px' }}
                      >
                        View Source
                      </a>
                    )}
                    {' | '}
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`portfolio-signal signal-${item.analysis?.action?.toLowerCase() || 'hold'}`}>
                    {item.analysis?.action || 'HOLD'}
                  </span>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-muted)', 
                    marginTop: '4px' 
                  }}>
                    {item.analysis?.confidence || 0}% confidence
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <h3 className="empty-state-title">No History Yet</h3>
            <p className="empty-state-text">
              Use the LiquiSight extension to scan financial charts and your analysis history will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
