import styles from './SearchBox.module.css';

const SearchBox = ({ value, onChange, autoFocus }) => (
  <div className={styles.search}>
    <span className={styles.icon} aria-hidden="true">🔍</span>
    <input
      className={styles.input}
      type="search"
      aria-label="Search expenses"
      placeholder="Search by description"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoFocus={autoFocus}
    />
    {value && (
      <button className={styles.clear} onClick={() => onChange('')} aria-label="Clear search">✕</button>
    )}
  </div>
);

export default SearchBox;
