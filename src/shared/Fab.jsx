import styles from './Fab.module.css';

// Round "+" button floating above the tab bar, on the right edge of the app column
const Fab = ({ label, onClick }) => (
  <div className={styles.dock}>
    <button className={styles.fab} onClick={onClick} aria-label={label} title={label}>
      <span aria-hidden="true">＋</span>
    </button>
  </div>
);

export default Fab;
