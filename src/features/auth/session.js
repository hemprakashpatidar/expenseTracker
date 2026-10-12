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

export const saveSession = ({ token, user }) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    token,
    userName: user.userName,
    isMe: user.isMe
  }));
};

export const clearSession = () => localStorage.removeItem(AUTH_STORAGE_KEY);

export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};
