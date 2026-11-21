// admin-dashboard.js — Works in both Demo Mode and Firebase Production Mode

let allConsultations = [];
let currentFilter    = 'All';
let currentEditId    = null;
let adminToken       = sessionStorage.getItem('adminToken');
let demoMode         = false;

// ── Auth Guard ─────────────────────────────────────────────
if (!adminToken) {
  window.location.href = 'admin-login.html';
}

// ── Set admin email in navbar ──────────────────────────────
document.getElementById('adminEmail').textContent =
  sessionStorage.getItem('adminEmail') || 'Admin';

// ── Logout ─────────────────────────────────────────────────
document.getElementById('topLogout').addEventListener('click',    doLogout);
document.getElementById('sidebarLogout').addEventListener('click', doLogout);

function doLogout() {
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('adminEmail');
  window.location.href = 'admin-login.html';
}

// ── Init ───────────────────────────────────────────────────
(async () => {
  try {
    const modeRes = await fetch('/api/demo-mode');
    const modeData = await modeRes.json();
    demoMode = modeData.demoMode;

    // For Firebase mode: refresh the token
    if (!demoMode) {
      try {
        const { auth } = await import('./firebase-config.js');
        const { onAuthStateChanged } = await import(
          'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'
        );
        onAuthStateChanged(auth, async (user) => {
          if (!user) { doLogout(); return; }
          adminToken = await user.getIdToken();
          sessionStorage.setItem('adminToken', adminToken);
          await loadConsultations();
        });
        return; // loadConsultations called inside onAuthStateChanged
      } catch { /* fall through to demo */ }
    }
    await loadConsultations();
  } catch (err) {
    console.error('Init error:', err);
    renderError();
  }
})();

// ── Fetch Consultations ────────────────────────────────────
async function loadConsultations() {
  try {
    const res = await fetch('/api/admin/consultations', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.status === 401) { doLogout(); return; }
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    allConsultations = data.consultations || [];
    updateStats();
    renderTable();

    // Show demo banner
    if (demoMode) showDemoBanner();
  } catch (err) {
    console.error('Load error:', err);
    renderError();
  }
}

// ── Demo Banner ────────────────────────────────────────────
function showDemoBanner() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    background:#fff3e0; border-left:4px solid #ff9800;
    padding:12px 20px; border-radius:8px; margin-bottom:1.5rem;
    font-size:0.84rem; color:#e65100; display:flex; align-items:center; gap:10px;
  `;
  banner.innerHTML = `
    <span style="font-size:1.2rem;">⚠️</span>
    <span>
      <strong>Demo Mode</strong> — Data is stored in memory and will reset when the server restarts.
      Add your Firebase credentials to switch to production mode.
    </span>
  `;
  document.querySelector('.dashboard-main').prepend(banner);
}

// ── Stats ──────────────────────────────────────────────────
function updateStats() {
  document.getElementById('statTotal').textContent    = allConsultations.length;
  document.getElementById('statPending').textContent  = allConsultations.filter(c => c.status === 'Pending').length;
  document.getElementById('statReviewed').textContent = allConsultations.filter(c => c.status === 'Reviewed').length;
}

// ── Render Table ───────────────────────────────────────────
function renderTable() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const list   = allConsultations.filter(c => {
    const matchFilter = currentFilter === 'All' || c.status === currentFilter;
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search) ||
      c.disease.toLowerCase().includes(search) ||
      (c.mobile || '').includes(search);
    return matchFilter && matchSearch;
  });

  const tbody = document.getElementById('tableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">
      <div class="e-icon">📭</div><div>No consultations found.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((c, i) => {
    const date = c.submittedAt
      ? new Date(c.submittedAt).toLocaleDateString('en-IN',
          { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    const statusClass = c.status === 'Reviewed' ? 'reviewed' : 'pending';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${esc(c.name)}</strong></td>
        <td>${esc(c.age || '—')} / ${esc(c.gender || '—')}</td>
        <td>${esc(c.mobile)}</td>
        <td>${esc(c.disease)}</td>
        <td style="white-space:nowrap;">${date}</td>
        <td><span class="status-badge ${statusClass}">${c.status}</span></td>
        <td>
          <div class="action-btns">
            ${c.status === 'Pending'
              ? `<button class="action-btn review"  onclick="toggleStatus('${c.id}','Reviewed')">✅ Review</button>`
              : `<button class="action-btn pending" onclick="toggleStatus('${c.id}','Pending')">🔄 Pending</button>`}
            <button class="action-btn notes"  onclick="openNotes('${c.id}')">📝 Notes</button>
            <button class="action-btn delete" onclick="deleteRecord('${c.id}')">🗑️ Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function renderError() {
  document.getElementById('tableBody').innerHTML = `<tr><td colspan="8" class="empty-state">
    <div class="e-icon">❌</div><div>Failed to load. Please refresh.</div></td></tr>`;
}

// ── Filter ─────────────────────────────────────────────────
window.filterConsultations = function(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTable();
};

// ── Toggle Status ──────────────────────────────────────────
window.toggleStatus = async function(id, newStatus) {
  try {
    const res = await fetch(`/api/admin/consultations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error();
    const c = allConsultations.find(x => x.id === id);
    if (c) c.status = newStatus;
    updateStats(); renderTable();
    showToast(`Status → ${newStatus}`, 'success');
  } catch { showToast('Update failed', 'error'); }
};

// ── Notes Modal ────────────────────────────────────────────
window.openNotes = function(id) {
  const c = allConsultations.find(x => x.id === id);
  if (!c) return;
  currentEditId = id;
  document.getElementById('modalPatientInfo').innerHTML =
    `<strong>${esc(c.name)}</strong> · ${esc(c.age||'')} ${esc(c.gender||'')} · ${esc(c.disease)}`;
  document.getElementById('modalNotes').value = c.adminNotes || '';
  document.getElementById('notesModal').classList.add('open');
};

window.closeModal = function() {
  document.getElementById('notesModal').classList.remove('open');
  currentEditId = null;
};

window.saveNotes = async function() {
  if (!currentEditId) return;
  const notes = document.getElementById('modalNotes').value.trim();
  try {
    const res = await fetch(`/api/admin/consultations/${currentEditId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ adminNotes: notes })
    });
    if (!res.ok) throw new Error();
    const c = allConsultations.find(x => x.id === currentEditId);
    if (c) c.adminNotes = notes;
    closeModal();
    showToast('Notes saved ✓', 'success');
  } catch { showToast('Save failed', 'error'); }
};

// ── Delete ─────────────────────────────────────────────────
window.deleteRecord = async function(id) {
  const c = allConsultations.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`Delete consultation for "${c.name}"? This cannot be undone.`)) return;
  try {
    const res = await fetch(`/api/admin/consultations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error();
    allConsultations = allConsultations.filter(x => x.id !== id);
    updateStats(); renderTable();
    showToast('Deleted ✓', 'success');
  } catch { showToast('Delete failed', 'error'); }
};

// ── Toast ──────────────────────────────────────────────────
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Escape HTML ────────────────────────────────────────────
function esc(s) {
  return String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Close modal on overlay click ───────────────────────────
document.getElementById('notesModal').addEventListener('click', e => {
  if (e.target === document.getElementById('notesModal')) closeModal();
});
