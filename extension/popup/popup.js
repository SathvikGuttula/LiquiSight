// LiquiSight Popup Controller
class LiquiSightPopup {
  constructor() {
    this.isActive = false;
    this.init();
  }

  async init() {
    await this.loadState();
    this.bindEvents();
    this.updateUI();
    this.loadStats();
  }

  async loadState() {
    const result = await chrome.storage.local.get(['isActive', 'user', 'stats']);
    this.isActive = result.isActive || false;
    this.user = result.user || null;
    this.stats = result.stats || { todayScans: 0, portfolioCount: 0, alertsCount: 0 };
  }

  bindEvents() {
    // Activate Button
    document.getElementById('activateBtn').addEventListener('click', () => this.toggleActivation());
    
    // Quick Actions
    document.getElementById('scanPageBtn').addEventListener('click', () => this.scanPage());
    document.getElementById('selectAreaBtn').addEventListener('click', () => this.selectArea());
    document.getElementById('historyBtn').addEventListener('click', () => this.openHistory());
    
    // Footer Links
    document.getElementById('openDashboard').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://liqui-sight.vercel.app/dashboard' });
    });
    
    document.getElementById('settingsBtn').addEventListener('click', (e) => {
      e.preventDefault();
      this.openSettings();
    });
  }

  async toggleActivation() {
    this.isActive = !this.isActive;
    await chrome.storage.local.set({ isActive: this.isActive });
    
    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { 
        action: this.isActive ? 'activate' : 'deactivate' 
      });
    }
    
    this.updateUI();
  }

  updateUI() {
    const btn = document.getElementById('activateBtn');
    const btnText = btn.querySelector('.btn-text');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = statusIndicator.querySelector('.status-text');
    
    if (this.isActive) {
      btn.classList.add('active');
      btnText.textContent = 'LiquiSight Active';
      statusIndicator.classList.add('active');
      statusText.textContent = 'Analyzing';
    } else {
      btn.classList.remove('active');
      btnText.textContent = 'Activate LiquiSight';
      statusIndicator.classList.remove('active');
      statusText.textContent = 'Ready';
    }
  }

  loadStats() {
    document.getElementById('todayScans').textContent = this.stats.todayScans;
    document.getElementById('portfolioCount').textContent = this.stats.portfolioCount;
    document.getElementById('alertsCount').textContent = this.stats.alertsCount;
  }

  async scanPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'scanFullPage' });
    }
    window.close();
  }

  async selectArea() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'selectArea' });
    }
    window.close();
  }

  openHistory() {
    chrome.tabs.create({ url: 'https://liqui-sight.vercel.app/history' });
  }

  openSettings() {
    chrome.tabs.create({ url: 'https://liqui-sight.vercel.app/settings' });
  }
}

// Initialize
new LiquiSightPopup();