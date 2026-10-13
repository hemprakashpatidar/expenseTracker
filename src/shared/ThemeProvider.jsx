import { useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './useTheme.js';
import { applyTheme, getThemePreference, prefersDark, saveThemePreference, watchSystemTheme } from './theme.js';

export const ThemeProvider = ({ children }) => {
  const [preference, setPreferenceState] = useState(getThemePreference);
  const [systemDark, setSystemDark] = useState(prefersDark);

  // Follow the device when it switches between light and dark
  useEffect(() => watchSystemTheme(setSystemDark), []);

  const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => { applyTheme(theme); }, [theme]);

  const value = useMemo(() => ({
    preference,
    theme,
    setPreference: (next) => { saveThemePreference(next); setPreferenceState(next); },
  }), [preference, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
