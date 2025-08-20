#!/bin/bash

# Simple build script for Operata extension without Node.js dependencies

echo "Building Operata Browser Extension..."

# Create dist directory
mkdir -p dist

# Copy core files
cp manifest.json dist/
cp popup.html dist/
cp popup.js dist/
cp background.js dist/
cp content.js dist/

# Copy icons
cp -r icons dist/

# Copy documentation
cp README.md dist/
cp install-guide.md dist/

echo "Extension built successfully in dist/ directory"
echo ""
echo "To install:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked' and select the 'dist' folder"
echo ""
echo "Extension files ready for distribution!"