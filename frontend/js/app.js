const API_URL = 'http://localhost:5000/api';

// --- Toast Notifications ---
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// --- Auth Handling ---
function setToken(token) {
  localStorage.setItem('lb_token', token);
}

function getToken() {
  return localStorage.getItem('lb_token');
}

function removeToken() {
  localStorage.removeItem('lb_token');
}

function isAuthenticated() {
  return !!getToken();
}

// Ensure protected routes
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

function requireNoAuth() {
  if (isAuthenticated()) {
    window.location.href = 'dashboard.html';
  }
}

// --- API Helpers ---
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || data?.msg || 'An error occurred';
      if (response.status === 401) {
        removeToken();
        window.location.href = 'login.html';
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Logout
function logout() {
  removeToken();
  window.location.href = 'login.html';
}
