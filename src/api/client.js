import { getAuthData, AUTH_EXPIRED_EVENT } from '../features/auth/session.js';

// keepalive lets a request finish after the page closes (used for a pending delete on tab close)
const apiRequest = async (method, endpoint, body, { keepalive = false } = {}) => {
  const apiPath = import.meta.env.VITE_API_PATH;
  const token = getAuthData()?.token;
  const response = await fetch(`${apiPath}${endpoint}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    keepalive,
  });
  if (response.status === 401) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  return response;
};

export const apiGet = (endpoint) => apiRequest('GET', endpoint);
export const apiPost = (endpoint, body) => apiRequest('POST', endpoint, body);
export const apiPatch = (endpoint, body) => apiRequest('PATCH', endpoint, body);
export const apiDelete = (endpoint, options) => apiRequest('DELETE', endpoint, undefined, options);
