import { useRef } from 'react';
import { getCategoryColor, getCategoryIcon } from '../../shared/categoryStyle.js';
import { formatAmount } from '../../shared/formatters.js';
import { formatShortDate, formatLongDate } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import styles from './TransactionCard.module.css';

const SWIPE_OPEN_PX = -60;
const SWIPE_CLOSE_PX = 20;
const VERTICAL_SCROLL_PX = 30;

const TransactionCard = ({
  transaction: t,
  showDate,
  isExpanded,
  isSwiped,
  isRecurring,
  onTap,
  onSwipeOpen,
  onSwipeClose,
  onDelete,
  onEdit,
  onToggleRecurring,
}) => {
  const touchRef = useRef({ startX: 0, startY: 0, wasSwiped: false });
  const color = getCategoryColor(t.category);
  // Inside a day group the heading already says the date
  const subtitle = showDate ? `${formatShortDate(t.date)} · ${t.category}` : t.category;

  const handleTouchStart = (e) => {
    if (t.pending) return;
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, wasSwiped: false };
  };

  const handleTouchEnd = (e) => {
    if (t.pending) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.startY);
    if (dy > VERTICAL_SCROLL_PX) return;
    if (dx < SWIPE_OPEN_PX) {
      touchRef.current.wasSwiped = true;
      onSwipeOpen();
    } else if (dx > SWIPE_CLOSE_PX && isSwiped) {
      touchRef.current.wasSwiped = true;
      onSwipeClose();
    }
  };

  // A row that's still saving can't be opened, edited or deleted until the server has it
  const handleClick = () => {
    if (t.pending) return;
    // A swipe also fires a click on touch devices; swallow it
    if (touchRef.current.wasSwiped) { touchRef.current.wasSwiped = false; return; }
    onTap();
  };

  const stop = (handler) => (e) => { e.stopPropagation(); handler(); };

  return (
    <div className={styles.wrapper}>
      {/* Only reachable by swiping; keyboard users have the Delete button in the expanded card */}
      <div className={styles.swipeDelete} onClick={stop(onDelete)} aria-hidden="true">
        🗑 Delete
      </div>
      <div
        className={cx(styles.card, isExpanded && styles.expanded, t.pending && styles.pending)}
        style={{ borderLeftColor: color, transform: `translateX(${isSwiped && !t.pending ? -82 : 0}px)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {/* Collapsed row; also the keyboard target for expanding (the card's buttons sit outside it) */}
        <div
          className={styles.row}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded && !t.pending}
          aria-disabled={t.pending || undefined}
          aria-label={`${t.expense}, ₹${formatAmount(t.amount)}, ${t.pending ? 'saving' : subtitle}`}
          onKeyDown={(e) => {
            if (t.pending) return;
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); }
          }}
        >
          <div className={styles.icon} style={{ background: `${color}18` }} aria-hidden="true">
            {getCategoryIcon(t.category)}
          </div>
          <div className={styles.info}>
            <div className={styles.name}>{t.expense}</div>
            <div className={styles.meta}>{t.pending ? 'Saving…' : subtitle}</div>
          </div>
          <div className={styles.amount}>₹{formatAmount(t.amount)}</div>
        </div>

        {/* Expanded details */}
        {isExpanded && !t.pending && (
          <div className={styles.details}>
            <div className={styles.chip}>
              <div className={styles.chipLabel}>Category</div>
              <div className={cx(styles.chipValue, styles.categoryText)} style={{ '--category': color }}>{t.category}</div>
            </div>
            <div className={styles.chip}>
              <div className={styles.chipLabel}>Amount</div>
              <div className={cx(styles.chipValue, styles.money)}>₹{formatAmount(t.amount)}</div>
            </div>
            <div className={styles.chip}>
              <div className={styles.chipLabel}>Date</div>
              <div className={styles.chipValue}>{formatLongDate(t.date)}</div>
            </div>
            <div className={styles.chip}>
              <div className={styles.chipLabel}>Description</div>
              <div className={styles.chipValue}>{t.expense}</div>
            </div>
            <div className={styles.fullWidth}>
              <button
                className={cx(styles.recurringBtn, isRecurring && styles.active)}
                onClick={stop(onToggleRecurring)}
              >
                <span aria-hidden="true">🔄</span> {isRecurring ? 'Remove from recurring' : 'Set as recurring'}
              </button>
            </div>

            <div className={styles.footer}>
              <span className={styles.hint}>Tap to collapse</span>
              <div className={styles.actions}>
                <button className={styles.deleteBtn} onClick={stop(onDelete)}>
                  <span aria-hidden="true">🗑</span> Delete
                </button>
                <button className={styles.editBtn} onClick={stop(onEdit)}>
                  <span aria-hidden="true">✏️</span> Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionCard;
