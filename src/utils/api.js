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

export const apiPost = async (endpoint, body) => {
  const apiPath = process.env.REACT_APP_API_PATH;
  const token = getAuthData()?.token;
  const response = await fetch(`${apiPath}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (response.status === 401) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  return response;
};
