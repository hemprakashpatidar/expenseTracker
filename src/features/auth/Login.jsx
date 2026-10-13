import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from './useAuth.js';
import styles from './AuthForm.module.css';

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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo} aria-hidden="true">💰</div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to see your expenses</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading && <span className={styles.spinner}></span>}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className={styles.switchRow}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.switchButton}>
              Create one here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
