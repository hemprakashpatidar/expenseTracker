import { useState } from 'react';
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from '../../shared/categoryStyle.js';
import { formatAmount } from '../../shared/formatters.js';
import { cx } from '../../shared/cx.js';
import styles from './SpendingBreakdown.module.css';

const COLLAPSED_COUNT = 4;
const OPEN_STORAGE_KEY = 'expense_tracker_breakdown_open';

const readOpen = () => {
  try { return localStorage.getItem(OPEN_STORAGE_KEY) === 'true'; } catch { return false; }
};
const saveOpen = (open) => {
  try { localStorage.setItem(OPEN_STORAGE_KEY, String(open)); } catch { /* not saved; still works this visit */ }
};

// Spending by category, largest first. Collapsed (the default) it is one stacked bar plus the
// top category; open, it lists a bar per category, and tapping one filters the list.
const SpendingBreakdown = ({ breakdown, total, selectedCategory, onSelectCategory }) => {
  const [open, setOpen] = useState(readOpen);
  const [showAll, setShowAll] = useState(false);
  const entries = Object.entries(breakdown).sort(([, a], [, b]) => b.total - a.total);
  if (entries.length === 0 || total <= 0) return null;

  const visible = showAll ? entries : entries.slice(0, COLLAPSED_COUNT);
  const hiddenCount = entries.length - COLLAPSED_COUNT;
  const [topCategory, { total: topAmount }] = entries[0];
  const topPercent = Math.round((topAmount / total) * 100);

  const toggle = () => {
    saveOpen(!open);
    setOpen(!open);
  };

  return (
    <section className={cx(styles.card, !open && styles.collapsed)} aria-label="Spending by category">
      <button className={styles.toggle} onClick={toggle} aria-expanded={open} aria-controls="spending-breakdown-list">
        <span className={styles.heading}>Where it went</span>
        {!open && (
          <span className={styles.topSummary}>
            <span aria-hidden="true">{getCategoryIcon(topCategory)}</span> {getCategoryLabel(topCategory)} {topPercent}%
          </span>
        )}
        <span className={cx(styles.chevron, open && styles.chevronOpen)} aria-hidden="true">▾</span>
      </button>

      {/* Collapsed: every category as a slice of one bar, so the split is still visible at a glance */}
      {!open && (
        <span className={styles.stacked} aria-hidden="true">
          {entries.map(([category, { total: amount }]) => (
            <span
              key={category}
              className={styles.slice}
              style={{ flexGrow: amount, '--category': getCategoryColor(category) }}
            />
          ))}
        </span>
      )}

      {open && (
        <>
          <ul className={styles.rows} id="spending-breakdown-list">
            {visible.map(([category, { total: amount, count }]) => {
              const percent = Math.round((amount / total) * 100);
              const selected = selectedCategory === category;
              return (
                <li key={category}>
                  <button
                    className={cx(styles.row, selected && styles.selected)}
                    onClick={() => onSelectCategory(selected ? 'All' : category)}
                    aria-pressed={selected}
                    aria-label={`${category}: ₹${formatAmount(Math.round(amount))}, ${percent}% of the month, ${count} ${count === 1 ? 'expense' : 'expenses'}. ${selected ? 'Showing only these; tap to show all.' : 'Tap to show only these.'}`}
                  >
                    <span className={styles.line}>
                      <span className={styles.name}>
                        <span aria-hidden="true">{getCategoryIcon(category)}</span> {category}
                      </span>
                      <span className={styles.value}>
                        ₹{formatAmount(Math.round(amount))} <span className={styles.percent}>{percent}%</span>
                      </span>
                    </span>
                    <span className={styles.track} aria-hidden="true">
                      <span className={styles.fill} style={{ width: `${Math.max(percent, 2)}%`, '--category': getCategoryColor(category) }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {hiddenCount > 0 && (
            <button className={styles.link} onClick={() => setShowAll(all => !all)} aria-expanded={showAll}>
              {showAll ? 'Show less' : `See all ${entries.length} categories`}
            </button>
          )}
        </>
      )}
    </section>
  );
};

export default SpendingBreakdown;
