// Auto-detect environment: localhost for local development, Render URL for production/GitHub Pages
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const CLOUD_API_BASE = 'https://personal-finance-tracker-ypyv.onrender.com/'; // Replace with your actual Render URL if different
const API_BASE = isLocalHost ? 'http://localhost:8080/api' : CLOUD_API_BASE;

function getToken() {
  return localStorage.getItem('ft_token');
}

function setSession(token, user) {
  localStorage.setItem('ft_token', token);
  if (user) {
    localStorage.setItem('ft_profile', JSON.stringify({
      name: user.name || '',
      email: user.email || '',
      since: user.since || new Date().toISOString().slice(0, 10)
    }));
  }
}

function clearSession() {
  localStorage.removeItem('ft_token');
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error(isLocalHost
      ? 'Cannot reach backend server. Make sure Spring Boot is running on port 8080.'
      : 'Cannot reach backend server. If using free hosting (e.g. Render), it may take ~50 seconds to wake up.');
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }

  if (res.status === 401) {
    clearSession();
    const onAuthPage = /login\.html|signup\.html$/i.test(location.pathname);
    if (!onAuthPage) location.href = 'login.html';
    throw new Error(data?.message || 'Please log in again');
  }
  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }
  return data;
}
