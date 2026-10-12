import { useState } from 'react';
import { useAuth } from './useAuth.js';
import { cx } from '../../shared/cx.js';
import styles from './AuthForm.module.css';

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

  // Derived from the current password on every render
  const passwordStrength = formData.password
    ? validatePasswordStrength(formData.password)
    : { score: 0, feedback: {} };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'username' ? sanitizeInput(value) : value
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

  const passwordField = (id, label, value, visible, setVisible, placeholder, autoComplete) => (
    <div className={styles.passwordContainer}>
      <input
        id={id}
        name={id}
        type={visible ? 'text' : 'password'}
        className={styles.input}
        value={value}
        onChange={handleInputChange}
        autoComplete={autoComplete}
        required
        disabled={loading}
        placeholder={placeholder}
      />
      <button
        type="button"
        className={styles.togglePassword}
        onClick={() => setVisible(!visible)}
        disabled={loading}
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      >
        {visible ? '🙈' : '👁️'}
      </button>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={cx(styles.card, styles.wide)}>
        <div className={styles.header}>
          <h1 className={styles.title}>📝 Register</h1>
          <p className={styles.subtitle}>Create your expense tracker account</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="username">
              👤 Username *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className={styles.input}
              value={formData.username}
              onChange={handleInputChange}
              autoComplete="username"
              required
              disabled={loading}
              placeholder="Choose a username"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">
              🔑 Password *
            </label>
            {passwordField('password', 'password', formData.password, showPassword, setShowPassword, 'Create a strong password', 'new-password')}

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(passwordStrength.score)
                    }}
                  />
                </div>
                <div className={styles.strengthText} style={{ color: getPasswordStrengthColor(passwordStrength.score) }}>
                  {getPasswordStrengthText(passwordStrength.score)}
                </div>
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="confirmPassword">
              🔑 Confirm Password *
            </label>
            {passwordField('confirmPassword', 'confirm password', formData.confirmPassword, showConfirmPassword, setShowConfirmPassword, 'Confirm your password', 'new-password')}
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading && <span className={styles.spinner}></span>}
            {loading ? 'Creating Account...' : '🚀 Create Account'}
          </button>

          <div className={styles.switchRow}>
            Already have an account?{' '}
            <button type="button" className={styles.switchButton} onClick={onSwitchToLogin}>
              Sign in here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
