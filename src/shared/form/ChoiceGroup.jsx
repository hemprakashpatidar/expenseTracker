import { useEffect, useRef, useState } from 'react';
import { cx } from '../cx.js';
import { CUSTOM } from './customChoice.js';
import styles from './SheetForm.module.css';

// One scrollable line of toggle chips, plus (when customOption is given) a "custom" option
// that reveals a text field.
// The selected chip is kept in view, including when the value changes from outside
// (auto category, a Recent shortcut). A chip that's already visible stays where it is, so the
// row doesn't slide around under your finger or while you type.
const ChoiceGroup = ({
  label, customLabel, options, renderOption, optionTitle, customOption,
  value, customValue, customPlaceholder, disabled, onChange, onCustomChange,
}) => {
  const rowRef = useRef(null);
  const firstRunRef = useRef(true);
  // While chips are hidden off the right edge, the row fades out there as a hint to scroll
  const [moreRight, setMoreRight] = useState(false);
  const updateMoreRight = (row) => setMoreRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 4);

  useEffect(() => {
    const row = rowRef.current;
    const selected = row?.querySelector('[aria-pressed="true"]');
    const firstRun = firstRunRef.current;
    firstRunRef.current = false;
    if (!row) return;
    if (firstRun) updateMoreRight(row);
    if (!selected) return;
    const left = selected.offsetLeft;
    const right = left + selected.offsetWidth;
    if (left >= row.scrollLeft && right <= row.scrollLeft + row.clientWidth) return;
    // Scroll only the row, never the sheet; jump on open rather than animate under the slide-in
    const target = left - (row.clientWidth - selected.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, target), behavior: firstRun ? 'auto' : 'smooth' });
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
      <div className={cx(styles.chipRow, moreRight && styles.moreRight)} ref={rowRef} onScroll={e => updateMoreRight(e.currentTarget)}>
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
