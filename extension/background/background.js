// LiquiSight Background Service Worker

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreen') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ dataUrl });
    });
    return true; // Keep message channel open for async response
  }
});

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LiquiSight installed');
  chrome.storage.local.set({
    isActive: false,
    stats: { todayScans: 0, portfolioCount: 0, alertsCount: 0 }
  });
});

// Keyboard shortcut handling
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-liqui-sight') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'togglePanel' });
      }
    });
  }
});