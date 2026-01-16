// Centralized API helper (keeps script.js clean)
const API_BASE = 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('echoTraceToken') || '';
}

function setToken(token) {
  localStorage.setItem('echoTraceToken', token);
}

function clearToken() {
  localStorage.removeItem('echoTraceToken');
}

async function apiFetch(path, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({ ok: false, message: 'Invalid JSON response.' }));
  if (!res.ok) {
    const msg = data && data.message ? data.message : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

async function signupApi(payload) {
  return apiFetch('/signup', { method: 'POST', body: JSON.stringify(payload) });
}

async function loginApi(payload) {
  return apiFetch('/login', { method: 'POST', body: JSON.stringify(payload) });
}

async function meApi() {
  return apiFetch('/me');
}

async function dashboardApi() {
  return apiFetch('/dashboard');
}

async function healthApi() {
  return apiFetch('/health');
}

async function statsApi() {
  return apiFetch('/stats');
}

async function timelineApi(filter) {
  const q = filter ? `?filter=${encodeURIComponent(filter)}` : '';
  return apiFetch(`/timeline${q}`);
}

async function sosApi(location) {
  return apiFetch('/sos', { method: 'POST', body: JSON.stringify({ location }) });
}

async function locationsApi() {
  return apiFetch('/locations');
}

async function contactsApi() {
  return apiFetch('/contacts');
}

async function addContactApi(payload) {
  return apiFetch('/contacts', { method: 'POST', body: JSON.stringify(payload) });
}

async function updateContactApi(id, payload) {
  return apiFetch(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

async function deleteContactApi(id) {
  return apiFetch(`/contacts/${id}`, { method: 'DELETE' });
}

async function privacyApi() {
  return apiFetch('/privacy');
}

async function updatePrivacyApi(payload) {
  return apiFetch('/privacy', { method: 'PUT', body: JSON.stringify(payload) });
}
