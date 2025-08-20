// Background service worker for Operata extension
console.log('Operata background service worker loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Operata extension installed:', details.reason);
  
  // Create context menu for file verification
  chrome.contextMenus.create({
    id: 'verifyFile',
    title: 'Verify with Operata',
    contexts: ['link'],
    targetUrlPatterns: ['*://*/*']
  });
  
  // Set default settings
  chrome.storage.local.set({
    extensionSettings: {
      notifications: true,
      autoVerify: false,
      defaultNetwork: null
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'verifyFile') {
    console.log('Verifying file:', info.linkUrl);
    
    // Send message to content script or open popup
    chrome.tabs.sendMessage(tab.id, {
      action: 'verifyFile',
      url: info.linkUrl
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'getStorageData':
      chrome.storage.local.get(request.keys, (data) => {
        sendResponse(data);
      });
      return true;
      
    case 'setStorageData':
      chrome.storage.local.set(request.data, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'showNotification':
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: request.title || 'Operata',
        message: request.message
      });
      break;
      
    case 'downloadFile':
      chrome.downloads.download({
        url: request.url,
        filename: request.filename
      });
      break;
  }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Storage changed:', changes, namespace);
  
  // Notify all tabs about storage updates
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'storageChanged',
        changes: changes
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
  });
});

// Periodic network sync (every 5 minutes)
setInterval(async () => {
  try {
    const { walletAddress, networks } = await chrome.storage.local.get(['walletAddress', 'networks']);
    
    if (walletAddress && networks) {
      console.log('Syncing network data...');
      // Could implement background sync with Firebase here
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}, 5 * 60 * 1000);