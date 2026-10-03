// ===================================================================
// CARECONNECT HOSPITAL - FIREBASE FIRESTORE ADAPTER
// Connects to Firebase Firestore using firebase-admin SDK
// Supports serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT environment variable
// ===================================================================

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let db = null;
let isFirebaseInitialized = false;

function initFirebase() {
  if (isFirebaseInitialized) return db;

  const keyPath = path.join(__dirname, 'serviceAccountKey.json');
  let credential = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsedKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(parsedKey);
    } catch (e) {
      console.warn('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT env variable.');
    }
  } else if (fs.existsSync(keyPath)) {
    credential = admin.credential.cert(keyPath);
  }

  if (credential) {
    try {
      admin.initializeApp({
        credential
      });
      db = admin.firestore();
      isFirebaseInitialized = true;
      console.log('🔥 [Firebase] Successfully connected to Firestore database!');
    } catch (error) {
      console.error('[Firebase] Initialization error:', error.message);
    }
  } else {
    console.log('ℹ️  [Firebase] No serviceAccountKey.json found yet. Place your serviceAccountKey.json in backend/config/ to enable Firestore.');
  }

  return db;
}

module.exports = {
  admin,
  initFirebase,
  getFirestore: () => db || initFirebase()
};
