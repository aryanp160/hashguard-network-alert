# Operata Browser Extension

A decentralized file verification and network management system as a browser extension, built with Solana blockchain integration and IPFS storage.

## Features

- **Wallet Integration**: Connect Phantom, Solflare, and other Solana wallets
- **File Verification**: Upload and verify files using IPFS and blockchain
- **Network Management**: Create and join trusted verification networks
- **Context Menu**: Right-click on files to verify them instantly
- **Real-time Notifications**: Get notified about network activity
- **ELO Rating System**: Reputation-based member scoring

## Installation

### Development Install
1. Clone this repository
2. Navigate to the `extension` directory
3. Install dependencies: `npm install`
4. Build the extension: `npm run build`
5. Open Chrome and go to `chrome://extensions/`
6. Enable "Developer mode"
7. Click "Load unpacked" and select the `extension/dist` folder

### Production Install
1. Download the extension from Chrome Web Store (coming soon)
2. Click "Add to Chrome"
3. Grant necessary permissions

## Setup

1. **Connect Wallet**: Click the extension icon and connect your Solana wallet
2. **Configure Pinata**: Add your Pinata API keys in Settings tab
3. **Join/Create Networks**: Create new networks or join existing ones
4. **Start Verifying**: Upload files or right-click on web files to verify

## Usage

### Basic File Verification
1. Click the extension icon
2. Go to "Files" tab
3. Click "Upload File" and select your file
4. File will be uploaded to IPFS and recorded on blockchain

### Network Collaboration
1. Create a network in the "Networks" tab
2. Share the join key with team members
3. All network members can verify files together
4. Get notifications about duplicate files and network activity

### Context Menu Verification
1. Right-click on any downloadable file on a webpage
2. Select "Verify with Operata"
3. Extension will attempt to verify the file

## Architecture

### Extension Components
- **Popup**: Main interface (400x600px)
- **Background Script**: Handles persistent operations
- **Content Script**: Injects verification into web pages
- **Firebase Integration**: Real-time database for networks
- **IPFS Storage**: Decentralized file storage via Pinata

### Data Flow
```
User Action → Extension Popup → Firebase/IPFS → Solana Blockchain
```

## Permissions

The extension requires these permissions:
- `storage`: Store user preferences and cached data
- `activeTab`: Access current tab for context menu features
- `contextMenus`: Add right-click verification options
- `downloads`: Handle file downloads
- `notifications`: Show verification alerts
- Host permissions for Firebase, Pinata, and Solana RPC

## Development

### Build System
- Webpack for bundling
- Babel for JavaScript transpilation
- CSS processing for styling
- Copy plugin for static assets

### File Structure
```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main interface
├── popup.js              # UI logic
├── background.js         # Service worker
├── content.js            # Page injection
├── src/
│   ├── popup-bundle.js   # Bundle entry
│   └── utils/            # Utility functions
├── icons/                # Extension icons
└── dist/                 # Built extension
```

### Building
```bash
npm install
npm run build
```

### Testing
1. Load unpacked extension in Chrome
2. Test wallet connection
3. Verify file upload functionality
4. Test network creation and joining
5. Check context menu integration

## Security

- All private keys remain in user's wallet
- API keys stored locally in browser storage
- Firebase security rules restrict data access
- Content Security Policy prevents XSS attacks

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Opera 74+ (Chromium-based)
- Firefox support planned (requires Manifest V2 version)

## Limitations

- 400px popup width constraint
- Chrome extension storage quotas
- No mobile browser support
- Requires internet connection for blockchain operations

## Support

For issues and questions:
1. Check the console for error messages
2. Verify wallet and API key configuration
3. Ensure network connectivity
4. Contact support with extension logs

## License

MIT License - see LICENSE file for details