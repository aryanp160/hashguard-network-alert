// Content script for Operata extension
console.log('Operata content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  switch (request.action) {
    case 'verifyFile':
      handleFileVerification(request.url);
      break;
      
    case 'storageChanged':
      handleStorageChange(request.changes);
      break;
  }
});

// Handle file verification from context menu
function handleFileVerification(fileUrl) {
  console.log('Verifying file from context menu:', fileUrl);
  
  // Show notification that verification is starting
  chrome.runtime.sendMessage({
    action: 'showNotification',
    title: 'Operata',
    message: 'Starting file verification...'
  });
  
  // Extract filename from URL
  const filename = fileUrl.split('/').pop() || 'unknown_file';
  
  // Open extension popup with verification context
  chrome.runtime.sendMessage({
    action: 'setStorageData',
    data: {
      pendingVerification: {
        url: fileUrl,
        filename: filename,
        timestamp: Date.now()
      }
    }
  });
}

// Handle storage changes
function handleStorageChange(changes) {
  console.log('Content script handling storage changes:', changes);
  
  // Could update page indicators or overlays here
  if (changes.networks) {
    console.log('Networks updated in content script');
  }
}

// Detect downloadable files on page
function detectDownloadableFiles() {
  const downloadLinks = document.querySelectorAll('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href$=".jpg"], a[href$=".png"], a[href$=".zip"]');
  
  downloadLinks.forEach(link => {
    // Add subtle indicator for verifiable files
    if (!link.dataset.operataProcessed) {
      link.dataset.operataProcessed = 'true';
      
      // Could add visual indicators here
      link.addEventListener('mouseenter', () => {
        link.title = `${link.title || ''} (Right-click to verify with Operata)`.trim();
      });
    }
  });
}

// Run file detection on page load and changes
detectDownloadableFiles();

// Watch for dynamic content changes
const observer = new MutationObserver(() => {
  detectDownloadableFiles();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  observer.disconnect();
});