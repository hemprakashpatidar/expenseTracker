import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Check for existing session on app load
  useEffect(() => {
    const savedAuth = localStorage.getItem('expense_tracker_auth');
    if (savedAuth) {
      try {
        const userData = JSON.parse(savedAuth);
        if (userData && userData.uuid) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error parsing saved auth data:', error);
        localStorage.removeItem('expense_tracker_auth');
      }
    }
    setLoading(false);
  }, []);
  const login = async (username, password) => {
    try {
      const apiPath = process.env.REACT_APP_API_PATH;
      const response = await fetch(`${apiPath}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const loginResponse = await response.json();
      if (response.ok) {
        setIsAuthenticated(true);
        console.log('userRERREEE', loginResponse)
        // Store user data as JSON string in localStorage
        localStorage.setItem('expense_tracker_auth', JSON.stringify({
          userName: loginResponse.user.userName, 
          uuid: loginResponse.user.uuid, 
          isMe: loginResponse.user.isMe
        }));
        return { success: true, user: loginResponse.user };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('expense_tracker_auth');
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 