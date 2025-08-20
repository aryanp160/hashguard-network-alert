# Operata Extension Installation Guide

## Quick Installation Steps

### 1. Install Dependencies
```bash
cd extension
npm install
```

### 2. Build Extension
```bash
npm run build
```

### 3. Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. The Operata extension icon should appear in your toolbar

### 4. Initial Setup
1. Click the Operata extension icon
2. Connect your Phantom wallet
3. Go to Settings tab and add your Pinata API keys:
   - Get free keys at [pinata.cloud](https://pinata.cloud)
   - API Key and Secret Key required for IPFS uploads
4. Create or join a network to start collaborating

## Features Available

### ✅ Core Features
- **Wallet Connection**: Connect Phantom and other Solana wallets
- **File Upload**: Upload files to IPFS with blockchain verification
- **Network Management**: Create and join verification networks
- **Context Menu**: Right-click files on websites to verify
- **Real-time Stats**: ELO ratings and network statistics

### ✅ Extension-Specific Features
- **Popup Interface**: Compact 400x600px dashboard
- **Background Processing**: Persistent network sync
- **Browser Integration**: Context menus and notifications
- **Offline Storage**: Local caching of network data

## Usage Instructions

### Basic File Verification
1. Click extension icon → Files tab
2. Click "Upload File" button
3. Select file and it uploads to IPFS
4. File hash recorded on Solana blockchain
5. Get notifications about upload status

### Network Collaboration
1. Networks tab → Create new network
2. Share join key with team members
3. All members can upload and verify files
4. Duplicate detection with ELO penalties/rewards
5. Real-time member statistics

### Website Integration
1. Right-click any downloadable file on websites
2. Select "Verify with Operata" from context menu
3. Extension attempts to download and verify file
4. Results shown in popup and notifications

## Troubleshooting

### Extension Won't Load
- Check Chrome version (88+ required)
- Ensure Developer Mode is enabled
- Try refreshing the extensions page
- Check browser console for errors

### Wallet Connection Issues
- Install Phantom wallet extension first
- Refresh the page after installing Phantom
- Check that Phantom is unlocked
- Try disconnecting and reconnecting

### File Upload Fails
- Verify Pinata API keys are correct
- Check internet connection
- Ensure file size is under 100MB
- Try different file types

### Network Features Not Working
- Check Firebase connectivity
- Verify wallet is connected
- Ensure you're a member of the network
- Try refreshing the extension

## Development Mode

For development and testing:

```bash
# Watch mode for live updates
npm run dev

# Clean build artifacts
npm run clean

# Rebuild completely
npm run clean && npm run build
```

## Browser Permissions

The extension requires these permissions:
- **Storage**: Save settings and cache data
- **Active Tab**: Context menu integration
- **Context Menus**: Right-click file verification
- **Downloads**: Handle file operations
- **Notifications**: Alert about network activity
- **Host Permissions**: Access Firebase, Pinata, Solana APIs

## Next Steps

1. **Create Your First Network**: Start with a personal verification network
2. **Upload Test Files**: Try uploading different file types
3. **Invite Team Members**: Share join keys with collaborators
4. **Explore Context Menus**: Right-click files on websites to verify
5. **Monitor ELO Ratings**: Track your reputation across networks

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all API keys and wallet connections
3. Try reloading the extension
4. Contact support with detailed error descriptions

The extension works entirely client-side with your existing Firebase and Pinata configurations from the main application.