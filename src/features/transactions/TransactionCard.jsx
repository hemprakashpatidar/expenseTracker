import { useRef } from 'react';
import { getCategoryColor, getCategoryIcon } from '../../shared/categoryStyle.js';
import { formatAmount } from '../../shared/formatters.js';
import { formatDisplayDate } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import styles from './TransactionCard.module.css';

const SWIPE_OPEN_PX = -60;
const SWIPE_CLOSE_PX = 20;
const VERTICAL_SCROLL_PX = 30;

const TransactionCard = ({
  transaction: t,
  isExpanded,
  isSwiped,
  isConfirmingDelete,
  isDeleting,
  isRecurring,
  onTap,
  onSwipeOpen,
  onSwipeClose,
  onRequestDelete,
  onCancelDelete,
  onDelete,
  onEdit,
  onToggleRecurring,
}) => {
  const touchRef = useRef({ startX: 0, startY: 0, wasSwiped: false });
  const color = getCategoryColor(t.category);
  const displayDate = formatDisplayDate(t.date);

  const handleTouchStart = (e) => {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, wasSwiped: false };
  };

  const handleTouchEnd = (e) => {
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

  const handleClick = () => {
    // A swipe also fires a click on touch devices; swallow it
    if (touchRef.current.wasSwiped) { touchRef.current.wasSwiped = false; return; }
    onTap();
  };

  const stop = (handler) => (e) => { e.stopPropagation(); handler(); };

  return (
    <div className={styles.wrapper}>
      <div className={styles.swipeDelete} onClick={stop(onDelete)}>
        🗑 Delete
      </div>
      <div
        className={cx(styles.card, isExpanded && styles.expanded, isDeleting && styles.deleting)}
        style={{ borderLeftColor: color, transform: `translateX(${isSwiped ? -82 : 0}px)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {/* Collapsed row */}
        <div className={styles.row}>
          <div className={styles.icon} style={{ background: `${color}18` }}>
            {getCategoryIcon(t.category)}
          </div>
          <div className={styles.info}>
            <div className={styles.name}>{t.expense}</div>
            <div className={styles.date}>{displayDate}</div>
          </div>
          <div className={styles.amount}>₹{formatAmount(t.amount)}</div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className={styles.details}>
            <div className={styles.chip}>
              <div className={styles.chipLabel}>Category</div>
              <div className={styles.chipValue} style={{ color }}>{t.category}</div>
            </div>
            <div className={styles.chip}>
              <div className={styles.chipLabel}>Amount</div>
              <div className={cx(styles.chipValue, styles.money)}>₹{formatAmount(t.amount)}</div>
            </div>
            <div className={styles.chip}>
              <div className={styles.chipLabel}>Date</div>
              <div className={styles.chipValue}>{displayDate}</div>
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
                🔄 {isRecurring ? 'Remove from recurring' : 'Set as recurring'}
              </button>
            </div>

            <div className={styles.footer}>
              <span className={styles.hint}>Tap to collapse</span>
              <div className={styles.actions}>
                {isConfirmingDelete ? (
                  <>
                    <button className={styles.cancelBtn} onClick={stop(onCancelDelete)}>
                      Cancel
                    </button>
                    <button className={styles.confirmBtn} onClick={stop(onDelete)}>
                      🗑 Sure?
                    </button>
                  </>
                ) : (
                  <button className={styles.deleteBtn} onClick={stop(onRequestDelete)}>
                    🗑 Delete
                  </button>
                )}
                <button className={styles.editBtn} onClick={stop(onEdit)}>
                  ✏️ Edit
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
