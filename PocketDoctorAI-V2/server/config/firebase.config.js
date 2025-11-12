// Minimal client-side Firestore stub for audit logs (optional)
let db = null;
try {
  const { initializeApp } = require('firebase/app');
  const { getFirestore } = require('firebase/firestore');
  const config = {
    projectId: process.env.FIREBASE_PROJECT_ID,
  };
  const app = initializeApp(config);
  db = getFirestore(app);
} catch (e) {
  // Firebase not configured or not needed
  db = null;
}
module.exports = { db };
