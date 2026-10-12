export const AUTH_STORAGE_KEY = 'expense_tracker_auth';
export const AUTH_EXPIRED_EVENT = 'expense_tracker_auth_expired';

// Stored shape: { token, userName, isMe }. isMe is only a UI hint; the server reads it from the token.
export const getAuthData = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const apiRequest = async (method, endpoint, body) => {
  const apiPath = import.meta.env.VITE_API_PATH;
  const token = getAuthData()?.token;
  const response = await fetch(`${apiPath}${endpoint}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (response.status === 401) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  return response;
};

export const apiGet = (endpoint) => apiRequest('GET', endpoint);
export const apiPost = (endpoint, body) => apiRequest('POST', endpoint, body);
export const apiPatch = (endpoint, body) => apiRequest('PATCH', endpoint, body);
export const apiDelete = (endpoint) => apiRequest('DELETE', endpoint);
