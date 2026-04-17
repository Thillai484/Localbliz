const API_URL = 'http://localhost:5000/api';

// ==============================
// TOKEN HANDLING
// ==============================
function setToken(token) {
  localStorage.setItem('lb_token', token);
}

function getToken() {
  return localStorage.getItem('lb_token');
}

function removeToken() {
  localStorage.removeItem('lb_token');
}

// ==============================
// API CALL (MAIN FIX)
// ==============================
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'API Error');
  }

  return data;
}

// ==============================
// AUTH HELPERS
// ==============================
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
  }
}

function logout() {
  removeToken();
  window.location.href = 'login.html';
}