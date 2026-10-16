import { useEffect, useRef, useState } from 'react';
import { cx } from './cx.js';
import { useTheme } from './useTheme.js';
import styles from './AppHeader.module.css';

const THEME_OPTIONS = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

// Search and Import only appear when their handlers are passed
const AppHeader = ({ title = 'Expenses', userName, searchOpen, onToggleSearch, onImport, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { preference, setPreference } = useTheme();
  const menuRef = useRef(null);

  // Close the menu on an outside click or Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    const onKeyDown = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const choose = (action) => () => { setMenuOpen(false); action(); };

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.actions}>
        {onToggleSearch && (
          <button
            className={cx(styles.iconBtn, searchOpen && styles.active)}
            onClick={onToggleSearch}
            aria-label={searchOpen ? 'Close search' : 'Search expenses'}
            aria-pressed={searchOpen}
          >
            <span aria-hidden="true">🔍</span>
          </button>
        )}

        <div className={styles.menuWrap} ref={menuRef}>
          <button
            className={styles.avatar}
            onClick={() => setMenuOpen(open => !open)}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {(userName?.[0] || '?').toUpperCase()}
          </button>
          {menuOpen && (
            <div className={styles.menu} role="menu">
              <div className={styles.menuUser}>Signed in as <strong>{userName || 'you'}</strong></div>
              <div className={styles.themeRow}>
                <span className={styles.themeLabel} id="theme-label">Theme</span>
                <div className={styles.segmented} role="radiogroup" aria-labelledby="theme-label">
                  {THEME_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      role="radio"
                      aria-checked={preference === option.value}
                      className={cx(styles.segment, preference === option.value && styles.segmentOn)}
                      onClick={() => setPreference(option.value)}
                      title={option.value === 'system' ? 'Follow your device setting' : undefined}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {onImport && (
                <button className={styles.menuItem} role="menuitem" onClick={choose(onImport)}>
                  <span aria-hidden="true">📥</span> Import statement
                </button>
              )}
              <button className={cx(styles.menuItem, styles.danger)} role="menuitem" onClick={choose(onLogout)}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
