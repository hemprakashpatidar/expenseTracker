// 'system' follows the device; 'light' / 'dark' are explicit choices. Saved per browser.
export const THEME_STORAGE_KEY = 'expense_tracker_theme';
export const THEME_PREFERENCES = ['system', 'light', 'dark'];

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export const getThemePreference = () => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_PREFERENCES.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
};

export const saveThemePreference = (preference) => {
  try { localStorage.setItem(THEME_STORAGE_KEY, preference); } catch { /* private mode: keep it for this visit */ }
};

export const prefersDark = () => darkQuery().matches;

// index.html runs the same logic inline before first paint, so there is no light flash
export const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#2a2670' : '#c7c2f5'); // top of the page glow
};

// Calls onChange(isDark) whenever the device setting flips; returns an unsubscribe function
export const watchSystemTheme = (onChange) => {
  const query = darkQuery();
  const listener = (e) => onChange(e.matches);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
};
