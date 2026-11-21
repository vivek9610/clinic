# Verma's Homopath Clinic

A full-stack homeopathic clinic website with patient consultation and admin dashboard.

---

## Project Structure

```
vermas-homopath-clinic/
├── server.js                      ← Express + Firebase Admin backend
├── firebase-service-account.json  ← Firebase credentials (fill this in)
├── package.json
├── .gitignore
└── public/
    ├── index.html                 ← Home page
    ├── about.html                 ← About Dr. Verma
    ├── services.html              ← Services / Diseases
    ├── consultation.html          ← Patient Consultation Form
    ├── contact.html               ← Contact page
    ├── admin-login.html           ← Admin Login (Firebase Auth)
    ├── admin-dashboard.html       ← Admin Dashboard
    ├── css/
    │   └── style.css              ← Global styles (white + green theme)
    └── js/
        ├── firebase-config.js     ← Firebase client config (fill this in)
        ├── nav.js                 ← Shared navbar logic
        ├── consultation.js        ← Patient form submission
        ├── admin-login.js         ← Firebase Auth login
        └── admin-dashboard.js     ← Admin dashboard logic
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase (Backend — Admin SDK)
- Go to [Firebase Console](https://console.firebase.google.com)
- Select your project → Project Settings → Service Accounts
- Click **Generate New Private Key** and download the JSON
- Replace `firebase-service-account.json` with the downloaded file

### 3. Configure Firebase (Frontend — Client SDK)
Open `public/js/firebase-config.js` and fill in your Firebase project values:
```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```
Find these at: Firebase Console → Project Settings → General → Your Apps → Web App

### 4. Create Admin User in Firebase
- Firebase Console → Authentication → Users → Add User
- Use the email/password you want Dr. Verma to log in with

### 5. Set Firestore Security Rules
In Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Patients can create consultations
    match /consultations/{id} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

### 6. Start the Server
```bash
npm start
```
Then open http://localhost:3000

---

## Admin Login
- Visit `http://localhost:3000/admin-login.html`
- Log in with the email/password created in Firebase Auth
- You'll be redirected to the Admin Dashboard

## Clinic Timings
Monday – Saturday: 9 AM – 1 PM & 5 PM – 8 PM  
Sunday: Closed

