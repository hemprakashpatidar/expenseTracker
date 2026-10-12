import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AUTH_STORAGE_KEY, AUTH_EXPIRED_EVENT, getAuthData, isTokenExpired } from '../utils/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  // Check for existing session on app load (sessions saved before token auth have no token)
  useEffect(() => {
    const savedAuth = getAuthData();
    if (savedAuth?.token && !isTokenExpired(savedAuth.token)) {
      setIsAuthenticated(true);
    } else if (savedAuth) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setLoading(false);
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
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          token: loginResponse.token,
          userName: loginResponse.user.userName,
          isMe: loginResponse.user.isMe
        }));
        setIsAuthenticated(true);
        return { success: true, user: loginResponse.user };
      } else {
        return { success: false, error: loginResponse.message };
      }
    } catch (error) {
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
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
