import styles from './AppHeader.module.css';

const AppHeader = ({ userName, onLogout }) => (
  <div className={styles.header}>
    <div>
      <h1 className={styles.title}>💰 Expense Tracker</h1>
      <p className={styles.greeting}>Hi, {userName || 'there'} 👋</p>
    </div>
    <div className={styles.right}>
      <div className={styles.avatar}>
        {(userName?.[0] || '?').toUpperCase()}
      </div>
      <button className={styles.logout} onClick={onLogout}>Logout</button>
    </div>
  </div>
);

export default AppHeader;
