import { todayISO, toISODate, formatShortDate } from '../dates.js';
import { cx } from '../cx.js';
import Icon from '../Icon.jsx';
import styles from './SheetForm.module.css';

const yesterdayISO = () => {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
};

// Today / Yesterday cover most entries; "Pick date" lays a transparent native date input
// over the chip, so a tap opens the platform's own picker
const DateChoice = ({ value, disabled, onChange }) => {
  const today = todayISO();
  const yesterday = yesterdayISO();
  const isOther = value !== today && value !== yesterday;

  const openPicker = (e) => {
    // Desktop Chrome only opens the calendar from its icon unless asked
    try { e.currentTarget.showPicker?.(); } catch { /* the input still works as typed */ }
  };

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>Date</legend>
      <div className={styles.chips}>
        <button type="button" className={cx(styles.chip, value === today && styles.selected)} aria-pressed={value === today} onClick={() => onChange(today)} disabled={disabled}>
          Today
        </button>
        <button type="button" className={cx(styles.chip, value === yesterday && styles.selected)} aria-pressed={value === yesterday} onClick={() => onChange(yesterday)} disabled={disabled}>
          Yesterday
        </button>
        <span className={cx(styles.chip, styles.pickChip, isOther && styles.selected)}>
          <Icon name="calendar" size={16} /> {isOther ? formatShortDate(value) : 'Pick date'}
          <input
            className={styles.pickInput}
            type="date"
            aria-label="Pick a date"
            value={value}
            onClick={openPicker}
            onChange={e => e.target.value && onChange(e.target.value)}
            disabled={disabled}
          />
        </span>
      </div>
    </fieldset>
  );
};

export default DateChoice;
