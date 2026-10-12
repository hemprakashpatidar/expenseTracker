import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './useAuth.js';
import { AUTH_EXPIRED_EVENT, getAuthData, isTokenExpired, saveSession, clearSession } from './session.js';

export const AuthProvider = ({ children }) => {
  // Restore the session synchronously so the first render already knows (sessions saved before token auth have no token)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = getAuthData();
    if (savedAuth?.token && !isTokenExpired(savedAuth.token)) return true;
    if (savedAuth) clearSession();
    return false;
  });

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    clearSession();
  }, []);

  // Any API call that comes back 401 ends the session
  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout);
  }, [logout]);

  const login = async (username, password) => {
    try {
      const apiPath = import.meta.env.VITE_API_PATH;
      const response = await fetch(`${apiPath}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const loginResponse = await response.json();
      if (response.ok) {
        saveSession(loginResponse);
        setIsAuthenticated(true);
        return { success: true, user: loginResponse.user };
      } else {
        return { success: false, error: loginResponse.message };
      }
    } catch {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const apiPath = import.meta.env.VITE_API_PATH;
      const response = await fetch(`${apiPath}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const value = {
    isAuthenticated,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
