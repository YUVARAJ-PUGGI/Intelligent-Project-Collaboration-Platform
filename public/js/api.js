// ========== API WRAPPER ==========
const API = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('token'); }
function getUser()  { return JSON.parse(localStorage.getItem('user') || 'null'); }
function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
function requireAuth() {
  if (!getToken()) { window.location.href = '/index.html'; return false; }
  return true;
}

async function api(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const data = await res.json();
    if (res.status === 401) { clearAuth(); window.location.href = '/index.html'; return null; }
    if (!res.ok) { showToast(data.message || 'Something went wrong', 'error'); return null; }
    return data;
  } catch (err) {
    showToast('Network error — is the server running?', 'error');
    return null;
  }
}

// ========== TOAST ==========
function showToast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ========== AVATAR HELPERS ==========
function initials(name) { return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
function avatarHtml(name, color, size = 'sm') {
  return `<div class="avatar avatar-${size}" style="background:${color || '#6366f1'}">${initials(name)}</div>`;
}

// ========== DATE/TIME HELPERS ==========
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function isOverdue(d) { return d && new Date(d) < new Date() ; }
function isDueSoon(d) { return d && !isOverdue(d) && new Date(d) < new Date(Date.now() + 24*3600000); }

// ========== STATUS / PRIORITY LABELS ==========
const statusLabels = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
const statusBadge  = { todo: 'badge-violet', inprogress: 'badge-amber', done: 'badge-emerald' };
const prioLabels   = { low: 'Low', medium: 'Medium', high: 'High' };
