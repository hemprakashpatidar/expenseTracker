import styles from './SearchBox.module.css';

const SearchBox = ({ value, onChange }) => (
  <div className={styles.search}>
    <span className={styles.icon}>🔍</span>
    <input
      className={styles.input}
      type="text"
      placeholder="Search..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default SearchBox;
