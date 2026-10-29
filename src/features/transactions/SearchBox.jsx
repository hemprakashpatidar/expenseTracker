import Icon from '../../shared/Icon.jsx';
import styles from './SearchBox.module.css';

const SearchBox = ({ value, onChange, autoFocus }) => (
  <div className={styles.search}>
    <span className={styles.icon}><Icon name="search" size={18} /></span>
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
      <button className={styles.clear} onClick={() => onChange('')} aria-label="Clear search"><Icon name="x" size={18} /></button>
    )}
  </div>
);

export default SearchBox;
