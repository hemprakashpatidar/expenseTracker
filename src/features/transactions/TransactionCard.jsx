import { useRef } from 'react';
import { getCategoryLabel } from '../../shared/categoryStyle.js';
import { formatAmount } from '../../shared/formatters.js';
import { formatShortDate } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import Icon from '../../shared/Icon.jsx';
import CategoryIcon from '../../shared/CategoryIcon.jsx';
import styles from './TransactionCard.module.css';

const SWIPE_OPEN_PX = -60;
const SWIPE_CLOSE_PX = 20;
const VERTICAL_SCROLL_PX = 30;

// One expense as a row inside its day's card. Tapping opens it for editing (delete and
// "repeat every month" live there too); swiping left is a shortcut to delete.
const TransactionCard = ({
  transaction: t,
  showDate,
  isSwiped,
  isRecurring,
  onOpen,
  onSwipeOpen,
  onSwipeClose,
  onDelete,
}) => {
  const touchRef = useRef({ startX: 0, startY: 0, wasSwiped: false });
  const label = getCategoryLabel(t.category);
  // Inside a day group the heading already says the date
  const subtitle = t.pending
    ? 'Saving…'
    : [showDate ? formatShortDate(t.date) : null, label, showDate ? null : t.paymentMethod].filter(Boolean).join(' · ');

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

  // A row that's still saving can't be opened or deleted until the server has it
  const handleClick = () => {
    if (t.pending) return;
    // A swipe also fires a click on touch devices; swallow it
    if (touchRef.current.wasSwiped) { touchRef.current.wasSwiped = false; return; }
    onOpen();
  };

  return (
    <li className={styles.wrapper}>
      {/* Only reachable by swiping; everyone else deletes from the edit sheet */}
      <div className={styles.swipeDelete} onClick={onDelete} aria-hidden="true">
        <Icon name="trash" size={18} /> Delete
      </div>
      <button
        type="button"
        className={cx(styles.row, t.pending && styles.pending)}
        style={{ transform: `translateX(${isSwiped && !t.pending ? -82 : 0}px)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        aria-disabled={t.pending || undefined}
        aria-label={`${t.expense}, ₹${formatAmount(t.amount)}, ${subtitle}${isRecurring ? ', repeats monthly' : ''}${t.pending ? '' : '. Open to edit'}`}
      >
        <CategoryIcon category={t.category} size={20} tile />
        <span className={styles.info}>
          <span className={styles.name}>
            <span className={styles.nameText}>{t.expense}</span>
            {isRecurring && <Icon name="repeat" size={13} className={styles.recurring} />}
          </span>
          <span className={styles.meta}>{subtitle}</span>
        </span>
        <span className={styles.amount}>₹{formatAmount(t.amount)}</span>
      </button>
    </li>
  );
};

export default TransactionCard;
