import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    loginCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      width: '100%',
      maxWidth: '400px'
    },
    header: {
      background: 'linear-gradient(135deg, #2C3E50 0%, #3498DB 100%)',
      color: 'white',
      padding: '2rem',
      textAlign: 'center'
    },
    title: {
      margin: 0,
      fontSize: '2rem',
      fontWeight: '600',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
      marginBottom: '0.5rem'
    },
    subtitle: {
      margin: 0,
      fontSize: '0.9rem',
      opacity: 0.9,
      fontWeight: '300'
    },
    form: {
      padding: '2rem'
    },
    inputGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#2c3e50'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '10px',
      border: '2px solid #e9ecef',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
    },
    error: {
      background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '1rem',
      fontSize: '0.9rem',
      textAlign: 'center'
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '20px',
      height: '20px',
      border: '3px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      borderTopColor: '#fff',
      animation: 'spin 1s ease-in-out infinite',
      marginRight: '8px'
    }
  };

  // Add spinner animation
  React.useEffect(() => {
    if (!document.getElementById('login-spinner')) {
      const style = document.createElement('style');
      style.id = 'login-spinner';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.header}>
          <h1 style={styles.title}>🔐 Login</h1>
          <p style={styles.subtitle}>Access your expense tracker</p>
        </div>
        
        <form style={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div style={styles.error}>
              ⚠️ {error}
            </div>
          )}
          
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="username">
              👤 Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef';
                e.target.style.boxShadow = 'none';
              }}
              required
              disabled={loading}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">
              🔑 Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef';
                e.target.style.boxShadow = 'none';
              }}
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {loading && <span style={styles.loadingSpinner}></span>}
            {loading ? 'Signing in...' : '🚀 Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 