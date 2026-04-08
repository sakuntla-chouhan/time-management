/* ============================================================
   config.js — Frontend API Configuration
   Change API_BASE_URL here for production deployment.
   ============================================================ */

const API_BASE_URL = (['localhost', '127.0.0.1', ''].includes(window.location.hostname))
  ? 'http://localhost:5000'
  : 'https://collab-share-r8ak.onrender.com';

// ── Helper: fetch with auth token ─────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('sc_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 120s for Gemini's deep massive structures
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options, signal: controller.signal,
      headers: { ...headers, ...(options.headers || {}) },
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw err;
  }
}

// ── API Methods ───────────────────────────────────────────────
const StudyCoachAPI = {
  // Auth
  signup: (name, email, password) =>
    apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  login: (email, password) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => apiFetch('/api/auth/me'),

  logout: () => {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    window.location.href = 'login.html';
  },

  isLoggedIn: () => !!localStorage.getItem('sc_token'),

  getUser: () => {
    try { return JSON.parse(localStorage.getItem('sc_user')); } catch { return null; }
  },

  // Gemini — real AI generation
  generate: (topic, hours, level) =>
    apiFetch('/api/generate', { method: 'POST', body: JSON.stringify({ topic, hours, level }) }),

  // Sessions
  saveSession: (topic, hours, score, level) =>
    apiFetch('/api/save-session', { method: 'POST', body: JSON.stringify({ topic, hours, score, level }) }),

  getSessions: () => apiFetch('/api/sessions'),

  // Health
  health: () => apiFetch('/api/health'),
};

window.StudyCoachAPI = StudyCoachAPI;
