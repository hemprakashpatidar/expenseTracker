import { NavLink } from 'react-router';
import { cx } from './cx.js';
import styles from './TabBar.module.css';

const TABS = [
  { to: '/', label: 'Expenses', icon: '💸', end: true },
  { to: '/people', label: 'People', icon: '👥' },
];

// Bottom navigation between the main sections; People stays active on /people/:id too
const TabBar = () => (
  <nav className={styles.bar} aria-label="Main">
    <div className={styles.inner}>
      {TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => cx(styles.tab, isActive && styles.active)}
        >
          <span className={styles.icon} aria-hidden="true">{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default TabBar;
