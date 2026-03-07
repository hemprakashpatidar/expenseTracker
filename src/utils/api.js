export const getAuthData = () => {
  try {
    const raw = localStorage.getItem('expense_tracker_auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const apiPost = (endpoint, body) => {
  const apiPath = process.env.REACT_APP_API_PATH;
  return fetch(`${apiPath}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer authenticated' },
    body: JSON.stringify(body),
  });
};
