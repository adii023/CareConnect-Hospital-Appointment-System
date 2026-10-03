// ===================================================================
// CARECONNECT HOSPITAL - FIREBASE FIRESTORE ADAPTER
// Connects to Firebase Firestore using firebase-admin SDK
// Supports serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT environment variable
// ===================================================================

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

let firestoreInstance = null;

function initFirebase() {
  if (firestoreInstance) return firestoreInstance;

  const keyPath = path.join(__dirname, 'serviceAccountKey.json');
  let credential = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsedKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = cert(parsedKey);
    } catch (e) {
      console.warn('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT env variable.');
    }
  } else if (fs.existsSync(keyPath)) {
    try {
      const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      credential = cert(keyData);
    } catch (e) {
      console.error('[Firebase] Error reading serviceAccountKey.json:', e.message);
    }
  }

  if (credential) {
    try {
      let app;
      if (getApps().length === 0) {
        app = initializeApp({ credential });
      } else {
        app = getApps()[0];
      }
      firestoreInstance = getFirestore(app);
      console.log('🔥 [Firebase] Successfully connected to Firestore database!');
    } catch (error) {
      console.error('[Firebase] Initialization error:', error.message);
    }
  } else {
    console.log('ℹ️  [Firebase] No serviceAccountKey.json found. Place your serviceAccountKey.json in backend/config/ to enable Firestore.');
  }

  return firestoreInstance;
}

module.exports = {
  initFirebase,
  getFirestore: () => firestoreInstance || initFirebase()
};
