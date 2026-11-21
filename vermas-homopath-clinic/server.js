// ============================================================
// server.js — Verma's Homopath Clinic — Express + Firebase
// DEMO MODE: Runs with in-memory storage when Firebase is not
//            yet configured. Switch to Firebase by filling in
//            firebase-service-account.json.
// ============================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const crypto  = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Detect Firebase Configuration ───────────────────────────
let db          = null;
let adminAuth   = null;
let DEMO_MODE   = true;

try {
  const serviceAccount = require('./firebase-service-account.json');
  const isPlaceholder  = serviceAccount.project_id === 'YOUR_PROJECT_ID';

  if (!isPlaceholder) {
    const admin = require('firebase-admin');
    admin.initializeApp({
      credential:  admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    db        = admin.firestore();
    adminAuth = admin.auth();
    DEMO_MODE = false;
    console.log('🔥  Firebase connected — Production Mode');
  } else {
    console.log('⚠️   Firebase not configured — running in DEMO MODE (in-memory storage)');
  }
} catch {
  console.log('⚠️   Firebase not configured — running in DEMO MODE (in-memory storage)');
}

// ── In-Memory Store (Demo Mode) ──────────────────────────────
const memStore = { consultations: [] };

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Helper: Verify Admin Token ───────────────────────────────
async function verifyAdmin(req, res, next) {
  if (DEMO_MODE) {
    // Demo: accept any bearer token that starts with "demo-"
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token && token.startsWith('demo-')) { req.user = { email: 'demo@admin.com' }; return next(); }
    return res.status(401).json({ error: 'Demo mode: use the demo admin login.' });
  }
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = await adminAuth.verifyIdToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ════════════════════════════════════════════════════════════
// DEMO LOGIN — only active in DEMO_MODE
// ════════════════════════════════════════════════════════════
app.post('/api/demo-login', (req, res) => {
  if (!DEMO_MODE) return res.status(404).json({ error: 'Not in demo mode' });
  const { email, password } = req.body;
  if (email === 'admin@clinic.com' && password === 'admin123') {
    return res.json({ success: true, token: 'demo-admin-token', email });
  }
  return res.status(401).json({ error: 'Invalid credentials. Use admin@clinic.com / admin123' });
});

app.get('/api/demo-mode', (_req, res) => res.json({ demoMode: DEMO_MODE }));

// ════════════════════════════════════════════════════════════
// PATIENT ROUTES
// ════════════════════════════════════════════════════════════
app.post('/api/consultation', async (req, res) => {
  try {
    const { name, age, gender, mobile, email, disease, medicalHistory, currentMedicines } = req.body;
    if (!name || !mobile || !disease)
      return res.status(400).json({ error: 'Name, Mobile, and Disease are required.' });

    if (DEMO_MODE) {
      const record = {
        id: crypto.randomUUID(), name: name.trim(), age: age || '', gender: gender || '',
        mobile: mobile.trim(), email: email ? email.trim() : '', disease: disease.trim(),
        medicalHistory: medicalHistory ? medicalHistory.trim() : '',
        currentMedicines: currentMedicines ? currentMedicines.trim() : '',
        status: 'Pending', adminNotes: '', submittedAt: new Date().toISOString()
      };
      memStore.consultations.unshift(record);
      return res.status(201).json({ success: true, id: record.id });
    }

    const { FieldValue } = require('firebase-admin').firestore;
    const docRef = await db.collection('consultations').add({
      name: name.trim(), age: age || '', gender: gender || '', mobile: mobile.trim(),
      email: email ? email.trim() : '', disease: disease.trim(),
      medicalHistory: medicalHistory ? medicalHistory.trim() : '',
      currentMedicines: currentMedicines ? currentMedicines.trim() : '',
      status: 'Pending', adminNotes: '', submittedAt: FieldValue.serverTimestamp()
    });
    res.status(201).json({ success: true, id: docRef.id });
  } catch (err) {
    console.error('POST /api/consultation:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════
app.get('/api/admin/consultations', verifyAdmin, async (req, res) => {
  if (DEMO_MODE) return res.json({ consultations: memStore.consultations });
  try {
    const snap = await db.collection('consultations').orderBy('submittedAt', 'desc').get();
    const data = snap.docs.map(doc => ({
      id: doc.id, ...doc.data(),
      submittedAt: doc.data().submittedAt ? doc.data().submittedAt.toDate().toISOString() : null
    }));
    res.json({ consultations: data });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

app.patch('/api/admin/consultations/:id', verifyAdmin, async (req, res) => {
  if (DEMO_MODE) {
    const c = memStore.consultations.find(x => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    if (req.body.status     !== undefined) c.status     = req.body.status;
    if (req.body.adminNotes !== undefined) c.adminNotes = req.body.adminNotes;
    return res.json({ success: true });
  }
  try {
    const updates = {};
    if (req.body.status     !== undefined) updates.status     = req.body.status;
    if (req.body.adminNotes !== undefined) updates.adminNotes = req.body.adminNotes;
    updates.updatedAt = require('firebase-admin').firestore.FieldValue.serverTimestamp();
    await db.collection('consultations').doc(req.params.id).update(updates);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

app.delete('/api/admin/consultations/:id', verifyAdmin, async (req, res) => {
  if (DEMO_MODE) {
    const idx = memStore.consultations.findIndex(x => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    memStore.consultations.splice(idx, 1);
    return res.json({ success: true });
  }
  try {
    await db.collection('consultations').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

// ── Fallback ─────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('🌿 ══════════════════════════════════════════════════');
  console.log(`   Verma's Homopath Clinic — http://localhost:${PORT}`);
  if (DEMO_MODE) {
    console.log('   Mode    : DEMO (in-memory, no Firebase needed)');
    console.log('   Admin   : http://localhost:' + PORT + '/admin-login.html');
    console.log('   Email   : admin@clinic.com');
    console.log('   Password: admin123');
  } else {
    console.log('   Mode    : PRODUCTION (Firebase Firestore)');
    console.log('   Admin   : http://localhost:' + PORT + '/admin-login.html');
  }
  console.log('🌿 ══════════════════════════════════════════════════');
  console.log('');
});

