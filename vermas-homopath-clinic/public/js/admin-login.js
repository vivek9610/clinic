// admin-login.js — Supports both Demo Mode and Firebase Auth

const loginForm = document.getElementById('loginForm');
const loginBtn  = document.getElementById('loginBtn');
const loginText = document.getElementById('loginText');
const loader    = document.getElementById('loginLoader');
const msgBox    = document.getElementById('loginMsg');

// Check if already logged in (demo token in sessionStorage)
if (sessionStorage.getItem('adminToken')) {
  window.location.href = 'admin-dashboard.html';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMsg();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password)
    return showMsg('error', '⚠️ Please enter both email and password.');

  setLoading(true);

  try {
    // Check if server is in demo mode
    const modeRes  = await fetch('/api/demo-mode');
    const modeData = await modeRes.json();

    if (modeData.demoMode) {
      // ── Demo Mode Login ──────────────────────────────────
      const res  = await fetch('/api/demo-login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('adminEmail', data.email);
        window.location.href = 'admin-dashboard.html';
      } else {
        showMsg('error', '❌ ' + (data.error || 'Invalid credentials.'));
        setLoading(false);
      }
    } else {
      // ── Firebase Auth Login ──────────────────────────────
      const { auth }                        = await import('./firebase-config.js');
      const { signInWithEmailAndPassword }  = await import(
        'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'
      );
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('adminEmail', email);
        window.location.href = 'admin-dashboard.html';
      } catch (err) {
        const msgs = {
          'auth/user-not-found':    '❌ No account found with this email.',
          'auth/wrong-password':    '❌ Incorrect password.',
          'auth/invalid-email':     '❌ Invalid email format.',
          'auth/too-many-requests': '❌ Too many attempts. Try later.',
          'auth/invalid-credential':'❌ Invalid email or password.'
        };
        showMsg('error', msgs[err.code] || '❌ Login failed. Try again.');
        setLoading(false);
      }
    }
  } catch (err) {
    console.error(err);
    showMsg('error', '❌ Could not connect to the server.');
    setLoading(false);
  }
});

function setLoading(state) {
  loginBtn.disabled       = state;
  loginText.style.display = state ? 'none' : 'inline';
  loader.style.display    = state ? 'inline-block' : 'none';
}
function showMsg(type, text) {
  msgBox.className   = `form-msg ${type} show`;
  msgBox.textContent = text;
}
function clearMsg() {
  msgBox.className   = 'form-msg';
  msgBox.textContent = '';
}
