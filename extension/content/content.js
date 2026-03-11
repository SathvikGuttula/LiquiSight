// =============================================
// LIQUI SIGHT - CONTENT SCRIPT
// Main controller for the browser extension overlay
// =============================================

class LiquiSight {
  constructor() {
    this.isActive = false;
    this.isPanelOpen = false;
    this.isLoggedIn = false;
    this.user = null;
    this.currentAnalysis = null;
    this.API_BASE = 'http://localhost:3001/api'; // Change for production
    
    this.init();
  }

  async init() {
    await this.loadState();
    this.injectOverlay();
    this.bindEvents();
    this.listenForMessages();
    
    // Check if we should auto-activate
    if (this.isActive) {
      this.activate();
    }
    
    console.log('🔷 LiquiSight initialized');
  }

  async loadState() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['isActive', 'user', 'token'], (result) => {
        this.isActive = result.isActive || false;
        this.user = result.user || null;
        this.token = result.token || null;
        this.isLoggedIn = !!this.user;
        resolve();
      });
    });
  }

  injectOverlay() {
    // Create main overlay container
    const overlay = document.createElement('div');
    overlay.id = 'liqui-sight-overlay';
    overlay.innerHTML = this.getOverlayHTML();
    document.body.appendChild(overlay);

    // Store references
    this.overlay = overlay;
    this.panel = overlay.querySelector('.ls-panel');
    this.triggerBtn = overlay.querySelector('.ls-trigger-btn');
    this.scanCorners = overlay.querySelector('.ls-scan-corners');
    this.scanLine = overlay.querySelector('.ls-scan-line');
    this.selectionOverlay = overlay.querySelector('.ls-selection-overlay');
    this.toastContainer = overlay.querySelector('.ls-toast-container');
  }

  getOverlayHTML() {
    return `
      <!-- Floating Trigger Button -->
      <button class="ls-trigger-btn" id="lsTrigger" title="Open LiquiSight">
        <svg viewBox="0 0 24 24" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      </button>

      <!-- Scanning Corner Effects -->
      <div class="ls-scan-corners" id="lsScanCorners">
        <div class="ls-corner top-left"></div>
        <div class="ls-corner top-right"></div>
        <div class="ls-corner bottom-left"></div>
        <div class="ls-corner bottom-right"></div>
        <div class="ls-scan-line" id="lsScanLine"></div>
      </div>

      <!-- Area Selection Overlay -->
      <div class="ls-selection-overlay" id="lsSelectionOverlay">
        <div class="ls-selection-box" id="lsSelectionBox">
          <div class="ls-selection-info">Drag to select area</div>
        </div>
      </div>

      <!-- Right Side Panel -->
      <div class="ls-panel" id="lsPanel">
        <!-- Panel Header -->
        <div class="ls-panel-header">
          <div class="ls-panel-logo">
            <div class="ls-panel-logo-icon">
              <svg viewBox="0 0 24 24" stroke-width="2">
                <path d="M3 17l6-6 4 4 8-8"/>
                <circle cx="17" cy="7" r="2"/>
              </svg>
            </div>
            <span class="ls-panel-title">LiquiSight</span>
          </div>
          <button class="ls-close-btn" id="lsClosePanel">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Login Section (shown when not logged in) -->
        <div class="ls-login-section" id="lsLoginSection">
          <div class="ls-login-card">
            <div class="ls-login-icon">
              <svg viewBox="0 0 24 24" stroke-width="2" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3 class="ls-login-title">Welcome to LiquiSight</h3>
            <p class="ls-login-subtitle">Sign in to save your analysis and get personalized recommendations</p>
            
            <div class="ls-input-group">
              <label class="ls-input-label">Email</label>
              <input type="email" class="ls-input" id="lsEmail" placeholder="you@example.com">
            </div>
            
            <div class="ls-input-group">
              <label class="ls-input-label">Password</label>
              <input type="password" class="ls-input" id="lsPassword" placeholder="••••••••">
            </div>
            
            <button class="ls-login-btn" id="lsLoginBtn">Sign In</button>
            
            <div class="ls-divider">or continue with</div>
            
            <button class="ls-google-btn" id="lsGoogleBtn">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        <!-- Analysis Section (shown when analyzing) -->
        <div class="ls-analysis-section" id="lsAnalysisSection">
          <!-- Content will be dynamically inserted -->
        </div>

        <!-- Loading State -->
        <div class="ls-loading" id="lsLoading" style="display: none;">
          <div class="ls-loading-spinner"></div>
          <p class="ls-loading-text">Analyzing financial data<span class="ls-loading-dots"></span></p>
        </div>
      </div>

      <!-- Toast Container -->
      <div class="ls-toast-container" id="lsToastContainer"></div>
    `;
  }

  bindEvents() {
    // Trigger button
    this.triggerBtn.addEventListener('click', () => this.togglePanel());

    // Close button
    document.getElementById('lsClosePanel').addEventListener('click', () => this.closePanel());

    // Login form
    document.getElementById('lsLoginBtn').addEventListener('click', () => this.handleLogin());
    document.getElementById('lsGoogleBtn').addEventListener('click', () => this.handleGoogleLogin());

    // Enter key on password field
    document.getElementById('lsPassword').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleLogin();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'l') {
        e.preventDefault();
        this.togglePanel();
      }
      if (e.key === 'Escape' && this.isPanelOpen) {
        this.closePanel();
      }
    });

    // Area selection
    this.setupAreaSelection();
  }

  listenForMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'activate':
          this.activate();
          break;
        case 'deactivate':
          this.deactivate();
          break;
        case 'scanFullPage':
          this.scanFullPage();
          break;
        case 'selectArea':
          this.startAreaSelection();
          break;
      }
      sendResponse({ success: true });
    });
  }

  // ============ PANEL CONTROLS ============

  togglePanel() {
    if (this.isPanelOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  openPanel() {
    this.panel.classList.add('open');
    this.isPanelOpen = true;
    this.updatePanelContent();
  }

  closePanel() {
    this.panel.classList.remove('open');
    this.isPanelOpen = false;
  }

  updatePanelContent() {
    const loginSection = document.getElementById('lsLoginSection');
    const analysisSection = document.getElementById('lsAnalysisSection');

    if (this.isLoggedIn) {
      loginSection.style.display = 'none';
      analysisSection.classList.add('active');
      if (this.currentAnalysis) {
        this.renderAnalysis(this.currentAnalysis);
      } else {
        analysisSection.innerHTML = this.getWelcomeContent();
      }
    } else {
      loginSection.style.display = 'block';
      analysisSection.classList.remove('active');
    }
  }

  getWelcomeContent() {
    return `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 102, 255, 0.1)); border-radius: 20px; display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <h3 style="color: #fff; font-size: 18px; margin-bottom: 8px;">Ready to Analyze</h3>
        <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 24px;">Select an area on a chart or financial data to get AI-powered insights</p>
        <button class="ls-action-btn primary" onclick="window.liquiSight.startAreaSelection()" style="width: 100%;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Select Area to Analyze
        </button>
      </div>
    `;
  }

  // ============ AUTHENTICATION ============

  async handleLogin() {
    const email = document.getElementById('lsEmail').value;
    const password = document.getElementById('lsPassword').value;

    if (!email || !password) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const response = await fetch(`${this.API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.user = data.user;
        this.token = data.token;
        this.isLoggedIn = true;

        // Save to storage
        await chrome.storage.local.set({ user: this.user, token: this.token });

        this.showToast('Welcome back!', 'success');
        this.updatePanelContent();
      } else {
        this.showToast(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showToast('Connection error', 'error');
    }
  }

  async handleGoogleLogin() {
    // For hackathon, we'll use a simplified flow
    // In production, implement proper OAuth
    this.showToast('Google login coming soon!', 'error');
  }

  // ============ SCANNING & ANALYSIS ============

  activate() {
    this.isActive = true;
    this.showScanningEffect();
  }

  deactivate() {
    this.isActive = false;
    this.hideScanningEffect();
  }

  showScanningEffect() {
    // Position corners around viewport
    this.scanCorners.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    `;
    this.scanCorners.classList.add('active', 'scanning');
  }

  hideScanningEffect() {
    this.scanCorners.classList.remove('active', 'scanning');
  }

  async scanFullPage() {
    this.openPanel();
    this.showLoading();
    this.runScanAnimation();

    try {
      // Capture screenshot
      const screenshot = await this.captureScreen();
      
      // Send to AI for analysis
      const analysis = await this.analyzeImage(screenshot);
      
      this.currentAnalysis = analysis;
      this.hideLoading();
      this.renderAnalysis(analysis);
      
      // Save to portfolio
      if (this.isLoggedIn) {
        await this.saveToPortfolio(analysis);
      }
      
      this.showToast('Analysis complete!', 'success');
    } catch (error) {
      console.error('Scan error:', error);
      this.hideLoading();
      this.showToast('Analysis failed', 'error');
    }
  }

  runScanAnimation() {
    this.showScanningEffect();
    this.scanLine.classList.add('active');
    
    setTimeout(() => {
      this.scanLine.classList.remove('active');
      this.hideScanningEffect();
    }, 2000);
  }

  async captureScreen() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'captureScreen' }, (response) => {
        resolve(response.dataUrl);
      });
    });
  }

  async captureArea(rect) {
    const fullScreenshot = await this.captureScreen();
    
    // Crop the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        const scale = window.devicePixelRatio;
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        
        ctx.drawImage(
          img,
          rect.x * scale,
          rect.y * scale,
          rect.width * scale,
          rect.height * scale,
          0,
          0,
          rect.width * scale,
          rect.height * scale
        );
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = fullScreenshot;
    });
  }

  async analyzeImage(imageData) {
    const response = await fetch(`${this.API_BASE}/analysis/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token || ''}`
      },
      body: JSON.stringify({
        image: imageData,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    return response.json();
  }

  // ============ AREA SELECTION ============

  setupAreaSelection() {
    let isSelecting = false;
    let startX, startY;
    const box = document.getElementById('lsSelectionBox');

    this.selectionOverlay.addEventListener('mousedown', (e) => {
      isSelecting = true;
      startX = e.clientX;
      startY = e.clientY;
      box.style.left = startX + 'px';
      box.style.top = startY + 'px';
      box.style.width = '0';
      box.style.height = '0';
      box.style.display = 'block';
    });

    this.selectionOverlay.addEventListener('mousemove', (e) => {
      if (!isSelecting) return;
      
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      
      box.style.left = left + 'px';
      box.style.top = top + 'px';
      box.style.width = width + 'px';
      box.style.height = height + 'px';
      
      // Update info
      box.querySelector('.ls-selection-info').textContent = `${width} × ${height}`;
    });

    this.selectionOverlay.addEventListener('mouseup', async (e) => {
      if (!isSelecting) return;
      isSelecting = false;
      
      const rect = box.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        this.endAreaSelection();
        await this.analyzeSelectedArea(rect);
      } else {
        box.style.display = 'none';
      }
    });
  }

  startAreaSelection() {
    this.closePanel();
    this.selectionOverlay.classList.add('active');
    this.showToast('Drag to select an area', 'success');
  }

  endAreaSelection() {
    this.selectionOverlay.classList.remove('active');
    document.getElementById('lsSelectionBox').style.display = 'none';
  }

  async analyzeSelectedArea(rect) {
    this.openPanel();
    this.showLoading();
    this.runScanAnimation();

    try {
      const screenshot = await this.captureArea(rect);
      const analysis = await this.analyzeImage(screenshot);
      
      this.currentAnalysis = analysis;
      this.hideLoading();
      this.renderAnalysis(analysis);
      
      if (this.isLoggedIn) {
        await this.saveToPortfolio(analysis);
      }
      
      this.showToast('Analysis complete!', 'success');
    } catch (error) {
      console.error('Analysis error:', error);
      this.hideLoading();
      this.showToast('Analysis failed', 'error');
    }
  }

  // ============ RENDER ANALYSIS RESULTS ============

  renderAnalysis(analysis) {
    const section = document.getElementById('lsAnalysisSection');
    
    section.innerHTML = `
      <!-- Stock Header -->
      <div class="ls-analysis-header">
        <div class="ls-stock-icon">${analysis.symbol?.substring(0, 2) || 'AI'}</div>
        <div class="ls-stock-info">
          <h3>${analysis.symbol || 'Financial Analysis'}</h3>
          <p>${analysis.name || 'AI-Powered Insight'}</p>
        </div>
      </div>

      <!-- Confidence Meter -->
      <div class="ls-confidence-meter">
        <div class="ls-confidence-header">
          <span class="ls-confidence-label">AI Confidence</span>
          <span class="ls-confidence-value">${analysis.confidence || 85}%</span>
        </div>
        <div class="ls-confidence-bar">
          <div class="ls-confidence-fill" style="width: ${analysis.confidence || 85}%"></div>
        </div>
      </div>

      <!-- Main Signal -->
      <div class="ls-signal-card ${analysis.signal?.toLowerCase() || 'neutral'}">
        <div class="ls-signal-title">
          ${analysis.signalTitle || 'Market Signal'}
          <span class="ls-signal-badge ${analysis.action?.toLowerCase() || 'hold'}">${analysis.action || 'HOLD'}</span>
        </div>
        <p class="ls-signal-description">${analysis.signalDescription || 'Based on the visual analysis of the chart pattern and indicators...'}</p>
      </div>

      <!-- Trend Analysis -->
      <div class="ls-signal-card bullish">
        <div class="ls-signal-title">📈 Trend Analysis</div>
        <p class="ls-signal-description">${analysis.trendAnalysis || 'Current trend shows upward momentum with increasing volume...'}</p>
      </div>

      <!-- Volatility -->
      <div class="ls-signal-card neutral">
        <div class="ls-signal-title">📊 Volatility</div>
        <p class="ls-signal-description">${analysis.volatility || 'Moderate volatility detected. Price swings within expected range.'}</p>
      </div>

      <!-- Risk Assessment -->
      <div class="ls-risk-section">
        <div class="ls-risk-header">
          <svg class="ls-risk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span class="ls-risk-title">Risk Assessment</span>
        </div>
        <div class="ls-risk-level">
          ${this.getRiskBars(analysis.riskLevel || 2)}
        </div>
        <div class="ls-risk-items">
          ${(analysis.risks || ['Market volatility may affect short-term positions', 'Consider position sizing carefully']).map(risk => `
            <div class="ls-risk-item">${risk}</div>
          `).join('')}
        </div>
      </div>

      <!-- Actions -->
      <div class="ls-actions">
        <button class="ls-action-btn primary" onclick="window.liquiSight.addToWatchlist('${analysis.symbol}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          Add to Portfolio
        </button>
        <button class="ls-action-btn secondary" onclick="window.liquiSight.startAreaSelection()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          New Scan
        </button>
      </div>
    `;

    section.classList.add('active');
  }

  getRiskBars(level) {
    const bars = [];
    for (let i = 0; i < 5; i++) {
      let className = 'ls-risk-bar';
      if (i < level) {
        className += ' filled';
        if (level <= 2) className += ' low';
        else if (level <= 3) className += ' medium';
      }
      bars.push(`<div class="${className}"></div>`);
    }
    return bars.join('');
  }

  // ============ PORTFOLIO ACTIONS ============

  async saveToPortfolio(analysis) {
    try {
      await fetch(`${this.API_BASE}/portfolio/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          analysis,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to save to portfolio:', error);
    }
  }

  async addToWatchlist(symbol) {
    if (!this.isLoggedIn) {
      this.showToast('Please login first', 'error');
      return;
    }

    try {
      await fetch(`${this.API_BASE}/portfolio/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ symbol })
      });
      this.showToast('Added to portfolio!', 'success');
    } catch (error) {
      this.showToast('Failed to add', 'error');
    }
  }

  // ============ UI HELPERS ============

  showLoading() {
    document.getElementById('lsLoading').style.display = 'flex';
    document.getElementById('lsAnalysisSection').classList.remove('active');
    document.getElementById('lsLoginSection').style.display = 'none';
  }

  hideLoading() {
    document.getElementById('lsLoading').style.display = 'none';
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `ls-toast ${type}`;
    toast.innerHTML = `
      <svg class="ls-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success' 
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
          : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      <span>${message}</span>
    `;
    
    this.toastContainer.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }
}

// Initialize and expose globally
window.liquiSight = new LiquiSight();