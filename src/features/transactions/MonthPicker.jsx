import { MONTH_NAMES } from '../../shared/constants.js';

const pad = (n) => String(n).padStart(2, '0');

// Five years back and four ahead of the current year
const buildOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, yi) => currentYear - 5 + yi)
    .flatMap(y => MONTH_NAMES.map((name, mi) => ({ value: `${y}-${pad(mi + 1)}`, label: `${name} ${y}` })));
};

const MonthPicker = ({ month, year, onChange }) => (
  <div className="et-month-wrap">
    <span className="et-month-icon">📅</span>
    <select
      className="et-month-select"
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
);

export default MonthPicker;
