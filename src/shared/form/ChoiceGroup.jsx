import { useEffect, useRef } from 'react';
import { cx } from '../cx.js';
import { CUSTOM } from './customChoice.js';
import styles from './SheetForm.module.css';

// One scrollable line of toggle chips, plus (when customOption is given) a "custom" option
// that reveals a text field.
// The selected chip is kept in view, including when the value changes from outside
// (auto category, a Recent shortcut).
const ChoiceGroup = ({
  label, customLabel, options, renderOption, optionTitle, customOption,
  value, customValue, customPlaceholder, disabled, onChange, onCustomChange,
}) => {
  const rowRef = useRef(null);

  useEffect(() => {
    const row = rowRef.current;
    const selected = row?.querySelector('[aria-pressed="true"]');
    if (!row || !selected) return;
    // Scroll only the row, never the sheet
    const target = selected.offsetLeft - (row.clientWidth - selected.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [value]);

  const choice = (key, content, title, ariaLabel) => (
    <button
      key={key}
      type="button"
      className={cx(styles.chip, value === key && styles.selected)}
      aria-pressed={value === key}
      aria-label={ariaLabel}
      title={title}
      onClick={() => onChange(key)}
      disabled={disabled}
    >
      {content}
    </button>
  );

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>{label}</legend>
      <div className={styles.chipRow} ref={rowRef}>
        {options.map(option => choice(option, renderOption(option), optionTitle?.(option)))}
        {customOption && choice(CUSTOM, customOption, undefined, customLabel[0].toUpperCase() + customLabel.slice(1))}
      </div>
      {value === CUSTOM && (
        <input
          className={cx(styles.input, styles.customInput)}
          type="text"
          aria-label={`Enter ${customLabel}`}
          value={customValue}
          onChange={e => onCustomChange(e.target.value)}
          placeholder={customPlaceholder}
          disabled={disabled}
          autoFocus
        />
      )}
    </fieldset>
  );
};

export default ChoiceGroup;
