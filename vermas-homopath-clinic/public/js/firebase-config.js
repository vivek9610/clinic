// ============================================================
// firebase-config.js — Firebase Client SDK Configuration
// ============================================================
// STEP: Replace ALL placeholder values below with your real
//       Firebase project configuration.
//
// HOW TO GET:
//   Firebase Console → Project Settings → General →
//   Your Apps → Web App → Config snippet
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

