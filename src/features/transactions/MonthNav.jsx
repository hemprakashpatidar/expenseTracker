import { MONTH_NAMES } from '../../shared/constants.js';
import Icon from '../../shared/Icon.jsx';
import styles from './MonthNav.module.css';

const pad = (n) => String(n).padStart(2, '0');
const YEARS_BACK = 5;
const YEARS_AHEAD = 4;

const firstYear = () => new Date().getFullYear() - YEARS_BACK;
const lastYear = () => new Date().getFullYear() + YEARS_AHEAD;

const buildOptions = () => {
  const years = Array.from({ length: YEARS_BACK + YEARS_AHEAD + 1 }, (_, i) => firstYear() + i);
  return years.flatMap(y => MONTH_NAMES.map((name, mi) => ({ value: `${y}-${pad(mi + 1)}`, label: `${name} ${y}` })));
};

const shift = (month, year, delta) => {
  const date = new Date(year, month - 1 + delta, 1);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
};

// < Oct 2026 v >  — a compact pill: the arrows step a month; tapping the name opens a native picker to jump
const MonthNav = ({ month, year, onChange }) => {
  const prev = shift(month, year, -1);
  const next = shift(month, year, 1);
  const canGoBack = prev.year >= firstYear();
  const canGoForward = next.year <= lastYear();

  return (
    <div className={styles.nav}>
      <button
        className={styles.arrow}
        onClick={() => onChange(prev.month, prev.year)}
        disabled={!canGoBack}
        aria-label={`Previous month, ${MONTH_NAMES[prev.month - 1]} ${prev.year}`}
      >
        <Icon name="chevronLeft" />
      </button>

      <div className={styles.current}>
        <span className={styles.label} aria-hidden="true">
          {MONTH_NAMES[month - 1].slice(0, 3)} {year} <Icon name="chevronDown" size={14} strokeWidth={2.5} className={styles.caret} />
        </span>
        <select
          className={styles.select}
          aria-label="Choose month"
          value={`${year}-${pad(month)}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-');
            onChange(parseInt(m, 10), parseInt(y, 10));
          }}
        >
          {buildOptions().map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <button
        className={styles.arrow}
        onClick={() => onChange(next.month, next.year)}
        disabled={!canGoForward}
        aria-label={`Next month, ${MONTH_NAMES[next.month - 1]} ${next.year}`}
      >
        <Icon name="chevronRight" />
      </button>
    </div>
  );
};

export default MonthNav;
