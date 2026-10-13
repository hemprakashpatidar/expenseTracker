import { createContext, useContext } from 'react';

export const ThemeContext = createContext({ preference: 'system', theme: 'light', setPreference: () => {} });

export const useTheme = () => useContext(ThemeContext);
