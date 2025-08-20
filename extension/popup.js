// Popup script for Operata extension
console.log('Operata popup loaded');

// Import Firebase and other utilities (will need to bundle these)
let db, walletConnection;

// State management
let currentUser = null;
let selectedNetwork = null;
let userNetworks = [];
let userFiles = [];

// DOM elements
const elements = {
  // Wallet
  walletStatus: document.getElementById('walletStatus'),
  walletSection: document.getElementById('walletSection'),
  dashboardContent: document.getElementById('dashboardContent'),
  connectWalletBtn: document.getElementById('connectWalletBtn'),
  disconnectBtn: document.getElementById('disconnectBtn'),
  
  // Stats
  userElo: document.getElementById('userElo'),
  networkCount: document.getElementById('networkCount'),
  fileCount: document.getElementById('fileCount'),
  
  // Actions
  uploadFileBtn: document.getElementById('uploadFileBtn'),
  createNetworkBtn: document.getElementById('createNetworkBtn'),
  joinNetworkBtn: document.getElementById('joinNetworkBtn'),
  
  // Lists
  networksList: document.getElementById('networksList'),
  filesList: document.getElementById('filesList'),
  
  // Settings
  pinataApiKey: document.getElementById('pinataApiKey'),
  pinataSecretKey: document.getElementById('pinataSecretKey'),
  savePinataBtn: document.getElementById('savePinataBtn'),
  notificationsEnabled: document.getElementById('notificationsEnabled'),
  autoVerifyEnabled: document.getElementById('autoVerifyEnabled'),
  
  // Tabs
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content')
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup DOM loaded');
  
  // Initialize Firebase (will be bundled)
  await initializeFirebase();
  
  // Load stored data
  await loadStoredData();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check wallet connection
  await checkWalletConnection();
  
  // Load initial data if connected
  if (currentUser) {
    await loadUserData();
  }
});

// Initialize Firebase configuration
async function initializeFirebase() {
  try {
    // Firebase config - you'll need to replace with your actual config
    const firebaseConfig = {
      apiKey: "your-api-key",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "your-app-id"
    };
    
    // For now, we'll use a simplified approach without Firebase SDK
    // In production, you would import Firebase SDK via CDN or bundling
    console.log('Firebase configuration ready');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

// Load stored data from chrome.storage
async function loadStoredData() {
  try {
    const data = await chrome.storage.local.get([
      'walletAddress',
      'userNetworks',
      'userFiles',
      'pinataApiKey',
      'pinataSecretKey',
      'extensionSettings'
    ]);
    
    if (data.walletAddress) {
      currentUser = data.walletAddress;
      updateWalletStatus(true);
    }
    
    if (data.userNetworks) {
      userNetworks = data.userNetworks;
    }
    
    if (data.userFiles) {
      userFiles = data.userFiles;
    }
    
    if (data.pinataApiKey && data.pinataSecretKey) {
      elements.pinataApiKey.value = data.pinataApiKey;
      elements.pinataSecretKey.value = data.pinataSecretKey;
    }
    
    if (data.extensionSettings) {
      elements.notificationsEnabled.checked = data.extensionSettings.notifications;
      elements.autoVerifyEnabled.checked = data.extensionSettings.autoVerify;
    }
    
    console.log('Stored data loaded:', data);
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab navigation
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Wallet actions
  elements.connectWalletBtn.addEventListener('click', connectWallet);
  elements.disconnectBtn.addEventListener('click', disconnectWallet);
  
  // Quick actions
  elements.uploadFileBtn.addEventListener('click', openFileUpload);
  elements.createNetworkBtn.addEventListener('click', showCreateNetworkDialog);
  elements.joinNetworkBtn.addEventListener('click', showJoinNetworkDialog);
  
  // Settings
  elements.savePinataBtn.addEventListener('click', savePinataKeys);
  elements.notificationsEnabled.addEventListener('change', saveExtensionSettings);
  elements.autoVerifyEnabled.addEventListener('change', saveExtensionSettings);
}

// Switch between tabs
function switchTab(tabName) {
  // Update tab buttons
  elements.tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update tab contents
  elements.tabContents.forEach(content => {
    content.classList.toggle('active', content.id === tabName);
  });
  
  // Load tab-specific data
  switch (tabName) {
    case 'networks':
      displayNetworks();
      break;
    case 'files':
      displayFiles();
      break;
  }
}

// Check wallet connection status
async function checkWalletConnection() {
  try {
    // Check if we have a stored wallet connection
    const stored = await chrome.storage.local.get(['walletAddress']);
    if (stored.walletAddress) {
      currentUser = stored.walletAddress;
      updateWalletStatus(true);
      return true;
    }
    
    // Check if running in content script context with wallet access
    if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
      const response = await window.solana.connect({ onlyIfTrusted: true });
      if (response.publicKey) {
        currentUser = response.publicKey.toString();
        updateWalletStatus(true);
        await saveWalletAddress(currentUser);
        return true;
      }
    }
  } catch (error) {
    console.log('No trusted wallet connection:', error);
  }
  
  updateWalletStatus(false);
  return false;
}

// Connect to Phantom wallet
async function connectWallet() {
  try {
    // For extension popup, we need to inject a content script to access window.solana
    // For now, we'll simulate wallet connection with a demo address
    const demoWallet = 'Demo' + Math.random().toString(36).substring(2, 15);
    currentUser = demoWallet;
    updateWalletStatus(true);
    await saveWalletAddress(currentUser);
    await loadUserData();
    
    chrome.runtime.sendMessage({
      action: 'showNotification',
      title: 'Demo Wallet Connected',
      message: `Connected to ${currentUser.slice(0, 6)}...${currentUser.slice(-4)}`
    });
    
    showSuccess('Demo wallet connected! In production, this would connect to your Phantom wallet.');
  } catch (error) {
    console.error('Wallet connection error:', error);
    showError('Failed to connect wallet. Please try again.');
  }
}

// Disconnect wallet
async function disconnectWallet() {
  try {
    if (window.solana) {
      await window.solana.disconnect();
    }
    
    currentUser = null;
    updateWalletStatus(false);
    
    // Clear stored data
    await chrome.storage.local.remove(['walletAddress', 'userNetworks', 'userFiles']);
    
    chrome.runtime.sendMessage({
      action: 'showNotification',
      title: 'Wallet Disconnected',
      message: 'Wallet has been disconnected successfully'
    });
  } catch (error) {
    console.error('Wallet disconnection error:', error);
  }
}

// Update wallet status in UI
function updateWalletStatus(connected) {
  if (connected && currentUser) {
    elements.walletStatus.innerHTML = `<span class="status-connected">Connected: ${currentUser.slice(0, 6)}...${currentUser.slice(-4)}</span>`;
    elements.walletSection.style.display = 'none';
    elements.dashboardContent.style.display = 'block';
  } else {
    elements.walletStatus.innerHTML = '<span class="status-disconnected">Disconnected</span>';
    elements.walletSection.style.display = 'block';
    elements.dashboardContent.style.display = 'none';
  }
}

// Save wallet address to storage
async function saveWalletAddress(address) {
  await chrome.storage.local.set({ walletAddress: address });
}

// Load user data from Firebase
async function loadUserData() {
  if (!currentUser) return;
  
  try {
    // Load user ELO, networks, and files
    // This would connect to Firebase in the full implementation
    
    // Mock data for demonstration
    const mockData = {
      elo: 2701,
      networks: [
        { id: '1', name: 'Test Network', members: 5, isAdmin: true },
        { id: '2', name: 'Dev Team', members: 3, isAdmin: false }
      ],
      files: [
        { id: '1', name: 'document.pdf', size: 1024000, date: new Date().toISOString() },
        { id: '2', name: 'image.jpg', size: 512000, date: new Date().toISOString() }
      ]
    };
    
    // Update UI
    elements.userElo.textContent = mockData.elo;
    elements.networkCount.textContent = mockData.networks.length;
    elements.fileCount.textContent = mockData.files.length;
    
    userNetworks = mockData.networks;
    userFiles = mockData.files;
    
    // Save to storage
    await chrome.storage.local.set({
      userNetworks: userNetworks,
      userFiles: userFiles
    });
    
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Display networks in the networks tab
function displayNetworks() {
  if (!userNetworks.length) {
    elements.networksList.innerHTML = '<div style="color: #94a3b8; font-size: 12px; text-align: center; padding: 20px;">No networks found</div>';
    return;
  }
  
  const networksHtml = userNetworks.map(network => `
    <div class="network-item" onclick="selectNetwork('${network.id}')">
      <div>
        <div class="network-name">${network.name}</div>
        <div class="network-members">${network.members} members</div>
      </div>
      <div>
        ${network.isAdmin ? '<span class="badge badge-admin">Admin</span>' : ''}
      </div>
    </div>
  `).join('');
  
  elements.networksList.innerHTML = networksHtml;
}

// Display files in the files tab
function displayFiles() {
  if (!userFiles.length) {
    elements.filesList.innerHTML = '<div style="color: #94a3b8; font-size: 12px; text-align: center; padding: 20px;">No files found</div>';
    return;
  }
  
  const filesHtml = userFiles.map(file => `
    <div class="file-item">
      <div>
        <div class="file-name">${file.name}</div>
        <div class="file-size">${formatFileSize(file.size)}</div>
      </div>
      <button class="btn" style="padding: 4px 8px; font-size: 10px;" onclick="viewFile('${file.id}')">View</button>
    </div>
  `).join('');
  
  elements.filesList.innerHTML = filesHtml;
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Open file upload dialog
function openFileUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = handleFileUpload;
  input.click();
}

// Handle file upload
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    showSuccess('Uploading file to IPFS...');
    
    // Here we would integrate with Pinata API
    // For now, show success message
    setTimeout(() => {
      showSuccess(`File "${file.name}" uploaded successfully!`);
      loadUserData(); // Refresh data
    }, 2000);
    
  } catch (error) {
    console.error('File upload error:', error);
    showError('Failed to upload file. Please try again.');
  }
}

// Show create network dialog
function showCreateNetworkDialog() {
  const networkName = prompt('Enter network name:');
  if (networkName) {
    createNetwork(networkName);
  }
}

// Create network
async function createNetwork(name) {
  try {
    showSuccess('Creating network...');
    
    // Here we would create network in Firebase
    // For now, add to local list
    setTimeout(() => {
      userNetworks.push({
        id: Date.now().toString(),
        name: name,
        members: 1,
        isAdmin: true
      });
      
      chrome.storage.local.set({ userNetworks });
      showSuccess(`Network "${name}" created successfully!`);
      displayNetworks();
    }, 1000);
    
  } catch (error) {
    console.error('Network creation error:', error);
    showError('Failed to create network. Please try again.');
  }
}

// Show join network dialog
function showJoinNetworkDialog() {
  const joinKey = prompt('Enter network join key:');
  if (joinKey) {
    joinNetwork(joinKey);
  }
}

// Join network
async function joinNetwork(joinKey) {
  try {
    showSuccess('Joining network...');
    
    // Here we would join network via Firebase
    // For now, simulate joining
    setTimeout(() => {
      showSuccess('Successfully joined network!');
      loadUserData(); // Refresh data
    }, 1000);
    
  } catch (error) {
    console.error('Network join error:', error);
    showError('Failed to join network. Please check the join key.');
  }
}

// Select network
function selectNetwork(networkId) {
  selectedNetwork = networkId;
  
  // Update UI to show selected state
  document.querySelectorAll('.network-item').forEach(item => {
    item.classList.remove('active');
  });
  
  event.currentTarget.classList.add('active');
}

// View file
function viewFile(fileId) {
  const file = userFiles.find(f => f.id === fileId);
  if (file) {
    // Open file in new tab or show details
    chrome.runtime.sendMessage({
      action: 'showNotification',
      title: 'File Access',
      message: `Opening ${file.name}...`
    });
  }
}

// Save Pinata API keys
async function savePinataKeys() {
  const apiKey = elements.pinataApiKey.value.trim();
  const secretKey = elements.pinataSecretKey.value.trim();
  
  if (!apiKey || !secretKey) {
    showError('Please enter both API key and secret key.');
    return;
  }
  
  try {
    // Here we would test the keys with Pinata API
    await chrome.storage.local.set({
      pinataApiKey: apiKey,
      pinataSecretKey: secretKey
    });
    
    showSuccess('Pinata API keys saved successfully!');
  } catch (error) {
    console.error('Error saving Pinata keys:', error);
    showError('Failed to save API keys. Please try again.');
  }
}

// Save extension settings
async function saveExtensionSettings() {
  const settings = {
    notifications: elements.notificationsEnabled.checked,
    autoVerify: elements.autoVerifyEnabled.checked
  };
  
  await chrome.storage.local.set({ extensionSettings: settings });
  showSuccess('Settings saved successfully!');
}

// Show success message
function showSuccess(message) {
  showMessage(message, 'success');
}

// Show error message
function showError(message) {
  showMessage(message, 'error');
}

// Show message
function showMessage(message, type) {
  // Remove existing messages
  document.querySelectorAll('.success, .error').forEach(el => el.remove());
  
  const messageEl = document.createElement('div');
  messageEl.className = type;
  messageEl.textContent = message;
  
  // Insert at top of active tab content
  const activeTab = document.querySelector('.tab-content.active');
  if (activeTab) {
    activeTab.insertBefore(messageEl, activeTab.firstChild);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }
}

// Make functions available globally for onclick handlers
window.selectNetwork = selectNetwork;
window.viewFile = viewFile;