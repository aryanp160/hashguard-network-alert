// Bundle entry point for popup
// This file will import and bundle all necessary dependencies

// Import Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Import utilities from main project
import { networkUtils } from './utils/networkUtils';
import { pinataUtils } from './utils/pinataUtils';
import { walletConnection } from './utils/walletConnection';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmYLl5Z8p_wX7VEXqE7HCKlN5HXr0QWg0",
  authDomain: "operata-firebase.firebaseapp.com",
  projectId: "operata-firebase",
  storageBucket: "operata-firebase.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Make available globally for popup.js
window.operataFirebase = { app, db };
window.operataUtils = { networkUtils, pinataUtils, walletConnection };

// Import and execute popup logic
import '../popup.js';