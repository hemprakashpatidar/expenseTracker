import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: {} });
  const { login, register } = useAuth();

  // Password strength validation
  const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].filter(Boolean).length;

    return {
      score,
      isValid: score >= 4,
      feedback: {
        length: password.length >= minLength ? '✓' : `At least ${minLength} characters`,
        upperCase: hasUpperCase ? '✓' : 'One uppercase letter',
        lowerCase: hasLowerCase ? '✓' : 'One lowercase letter',
        numbers: hasNumbers ? '✓' : 'One number',
        specialChar: hasSpecialChar ? '✓' : 'One special character'
      }
    };
  };


  // Input sanitization
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>"'&]/g, (match) => {
      const escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match];
    });
  };

  // Update password strength on password change
  React.useEffect(() => {
    if (formData.password) {
      const strength = validatePasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: {} });
    }
  }, [formData.password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: sanitizeInput(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!passwordStrength.isValid) {
      setError('Password does not meet strength requirements.');
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        username: formData.username.trim(),
        password: formData.password
      });

      if (result.success) {
        // Registration successful, auto-login
        const loginResult = await login(formData.username, formData.password);
        if (loginResult.success) {
          // Redirect or show success message
          console.log('Registration and login successful');
        } else {
          setError('Registration successful, but login failed. Please try logging in manually.');
        }
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (score) => {
    if (score < 2) return '#e74c3c';
    if (score < 4) return '#f39c12';
    return '#27ae60';
  };

  const getPasswordStrengthText = (score) => {
    if (score < 2) return 'Weak';
    if (score < 4) return 'Medium';
    return 'Strong';
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
    registerCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      width: '100%',
      maxWidth: '500px'
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
    passwordContainer: {
      position: 'relative',
      width: '100%'
    },
    togglePassword: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1.2rem',
      padding: '4px',
      borderRadius: '4px',
      transition: 'background-color 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px'
    },
    passwordStrength: {
      marginTop: '8px'
    },
    strengthBar: {
      width: '100%',
      height: '4px',
      backgroundColor: '#e9ecef',
      borderRadius: '2px',
      overflow: 'hidden',
      marginBottom: '4px'
    },
    strengthFill: {
      height: '100%',
      transition: 'width 0.3s ease, background-color 0.3s ease'
    },
    strengthText: {
      fontSize: '0.8rem',
      fontWeight: '600',
      textAlign: 'right'
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
    },
    loginLink: {
      textAlign: 'center',
      marginTop: '1.5rem',
      fontSize: '0.9rem',
      color: '#6c757d'
    },
    loginLinkButton: {
      background: 'none',
      border: 'none',
      color: '#667eea',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontSize: '0.9rem',
      fontWeight: '600'
    }
  };

  // Add spinner animation
  React.useEffect(() => {
    if (!document.getElementById('register-spinner')) {
      const style = document.createElement('style');
      style.id = 'register-spinner';
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
      <div style={styles.registerCard}>
        <div style={styles.header}>
          <h1 style={styles.title}>📝 Register</h1>
          <p style={styles.subtitle}>Create your expense tracker account</p>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div style={styles.error}>
              ⚠️ {error}
            </div>
          )}


          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="username">
              👤 Username *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
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
              placeholder="Choose a username"
            />
          </div>


          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">
              🔑 Password *
            </label>
            <div style={styles.passwordContainer}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                style={{...styles.input, paddingRight: '50px'}}
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
                placeholder="Create a strong password"
              />
              <button
                type="button"
                style={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div style={styles.passwordStrength}>
                <div style={styles.strengthBar}>
                  <div
                    style={{
                      ...styles.strengthFill,
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(passwordStrength.score)
                    }}
                  />
                </div>
                <div style={{
                  ...styles.strengthText,
                  color: getPasswordStrengthColor(passwordStrength.score)
                }}>
                  {getPasswordStrengthText(passwordStrength.score)}
                </div>
              </div>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="confirmPassword">
              🔑 Confirm Password *
            </label>
            <div style={styles.passwordContainer}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={{...styles.input, paddingRight: '50px'}}
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
                placeholder="Confirm your password"
              />
              <button
                type="button"
                style={styles.togglePassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
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
            {loading ? 'Creating Account...' : '🚀 Create Account'}
          </button>

          <div style={styles.loginLink}>
            Already have an account?{' '}
            <button
              type="button"
              style={styles.loginLinkButton}
              onClick={onSwitchToLogin}
            >
              Sign in here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
