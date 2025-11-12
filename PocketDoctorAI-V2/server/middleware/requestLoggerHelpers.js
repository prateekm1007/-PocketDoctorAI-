// Minimal Firestore audit helper (replace with SIEM/data lake in prod)
const { db } = require('../config/firebase.config');
const { doc, setDoc, serverTimestamp } = require('firebase/firestore');
const { v4: uuidv4 } = require('uuid');

async function auditLog(action, details = {}) {
  try {
    if (!db) return; // no-op if Firebase not configured
    const ref = doc(db, 'auditLogs', uuidv4());
    await setDoc(ref, { action, ...details, ts: serverTimestamp(), env: process.env.NODE_ENV || 'production' });
  } catch (e) {
    // Never break app on audit failure
    console.error('Audit log failure:', e.message);
  }
}

module.exports = { auditLog };
