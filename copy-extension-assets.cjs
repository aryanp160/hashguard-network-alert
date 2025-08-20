// This script copies manifest.json and all .png icons from public/ to dist/ after build
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

// Copy manifest.json
fs.copyFileSync(path.join(publicDir, 'manifest.json'), path.join(distDir, 'manifest.json'));

// Copy all .png icons
fs.readdirSync(publicDir)
  .filter(f => f.endsWith('.png'))
  .forEach(f => {
    fs.copyFileSync(path.join(publicDir, f), path.join(distDir, f));
  });

console.log('Copied manifest.json and icons to dist/');
