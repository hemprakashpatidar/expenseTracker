import Icon from './Icon.jsx';
import styles from './Fab.module.css';

// "+" button floating above the tab bar, on the right edge of the app column
const Fab = ({ label, onClick }) => (
  <div className={styles.dock}>
    <button className={styles.fab} onClick={onClick} aria-label={label} title={label}>
      <Icon name="plus" size={26} strokeWidth={2.25} />
    </button>
  </div>
);

export default Fab;
