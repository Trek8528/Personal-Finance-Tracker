const API_BASE = 'http://localhost:8080/api';

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
    throw new Error('Cannot reach the server. Start the Spring Boot backend on port 8080.');
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
