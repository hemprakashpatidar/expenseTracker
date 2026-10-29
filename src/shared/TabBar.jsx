import { NavLink } from 'react-router';
import { cx } from './cx.js';
import Icon from './Icon.jsx';
import styles from './TabBar.module.css';

const TABS = [
  { to: '/', label: 'Expenses', icon: 'wallet', end: true },
  { to: '/people', label: 'People', icon: 'user' },
  { to: '/groups', label: 'Groups', icon: 'users' },
];

// Bottom navigation between the main sections; a tab stays active on its detail pages too
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
          <span className={styles.icon}><Icon name={tab.icon} size={22} /></span>
          <span className={styles.label}>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default TabBar;
