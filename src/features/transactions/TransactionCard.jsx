import { useRef } from 'react';
import { getCategoryColor, getCategoryIcon } from '../../shared/categoryStyle.js';
import { formatAmount } from '../../shared/formatters.js';
import { formatDisplayDate } from '../../shared/dates.js';

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
    <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden' }}>
      <div className="et-swipe-delete" onClick={stop(onDelete)}>
        🗑 Delete
      </div>
      <div
        className={`et-tx${isExpanded ? ' expanded' : ''}${isDeleting ? ' et-deleting' : ''}`}
        style={{
          borderLeftColor: color,
          transform: `translateX(${isSwiped ? -82 : 0}px)`,
          transition: 'transform 0.25s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {/* Collapsed row */}
        <div className="et-tx-row">
          <div className="et-tx-icon" style={{ background: `${color}18` }}>
            {getCategoryIcon(t.category)}
          </div>
          <div className="et-tx-info">
            <div className="et-tx-name">{t.expense}</div>
            <div className="et-tx-date">{displayDate}</div>
          </div>
          <div className="et-tx-amount">₹{formatAmount(t.amount)}</div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="et-expanded-inner">
            <div className="et-expanded-chip">
              <div className="et-expanded-label">Category</div>
              <div className="et-expanded-val" style={{ color }}>{t.category}</div>
            </div>
            <div className="et-expanded-chip">
              <div className="et-expanded-label">Amount</div>
              <div className="et-expanded-val" style={{ color: '#ef4444', fontFamily: 'DM Mono, monospace' }}>₹{formatAmount(t.amount)}</div>
            </div>
            <div className="et-expanded-chip">
              <div className="et-expanded-label">Date</div>
              <div className="et-expanded-val">{displayDate}</div>
            </div>
            <div className="et-expanded-chip">
              <div className="et-expanded-label">Description</div>
              <div className="et-expanded-val">{t.expense}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button
                onClick={stop(onToggleRecurring)}
                style={{
                  width: '100%',
                  background: isRecurring ? '#ede9ff' : '#f3f4f6',
                  color: isRecurring ? '#4f46e5' : '#6b7280',
                  border: isRecurring ? '1.5px solid #c4b5fd' : '1.5px solid transparent',
                  borderRadius: '9px', padding: '7px 10px',
                  fontSize: '12px', fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  transition: 'all 0.15s',
                }}
              >
                🔄 {isRecurring ? 'Remove from recurring' : 'Set as recurring'}
              </button>
            </div>

            <div className="et-expanded-footer">
              <span className="et-expanded-hint">Tap to collapse</span>
              <div className="et-action-group">
                {isConfirmingDelete ? (
                  <>
                    <button className="et-cancel-delete-btn" onClick={stop(onCancelDelete)}>
                      Cancel
                    </button>
                    <button className="et-delete-confirm-btn" onClick={stop(onDelete)}>
                      🗑 Sure?
                    </button>
                  </>
                ) : (
                  <button className="et-delete-btn" onClick={stop(onRequestDelete)}>
                    🗑 Delete
                  </button>
                )}
                <button className="et-edit-btn" onClick={stop(onEdit)}>
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
