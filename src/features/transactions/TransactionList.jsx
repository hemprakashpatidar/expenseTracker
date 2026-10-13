import { useState } from 'react';
import TransactionCard from './TransactionCard.jsx';
import { cx } from '../../shared/cx.js';
import { formatAmount } from '../../shared/formatters.js';
import { formatDayHeading } from '../../shared/dates.js';
import { groupByDay } from './filtering.js';
import skeleton from '../../shared/Skeleton.module.css';
import styles from './TransactionList.module.css';

const SORT_OPTIONS = [{ key: 'date', icon: '📅', label: 'Date' }, { key: 'amount', icon: '₹', label: 'Amount' }];

const SortButtons = ({ sortBy, sortDirection, onSort }) => (
  <div className={styles.sortButtons}>
    {SORT_OPTIONS.map(({ key, icon, label }) => (
      <button
        key={key}
        className={cx(styles.sortBtn, sortBy === key && styles.active)}
        onClick={() => onSort(key)}
        aria-pressed={sortBy === key}
        aria-label={sortBy === key
          ? `Sorted by ${label.toLowerCase()}, ${sortDirection === 'desc' ? (key === 'date' ? 'newest' : 'highest') : (key === 'date' ? 'oldest' : 'lowest')} first`
          : `Sort by ${label.toLowerCase()}`}
      >
        <span aria-hidden="true">{icon}</span> {label} <span aria-hidden="true">{sortBy === key ? (sortDirection === 'desc' ? '↓' : '↑') : ''}</span>
      </button>
    ))}
  </div>
);

const SkeletonCards = () => Array.from({ length: 5 }).map((_, i) => (
  <div key={i} className={skeleton.card}>
    <div className={cx(skeleton.block, skeleton.circle)} />
    <div className={skeleton.info}>
      <div className={cx(skeleton.block, styles.skLine)} style={{ width: `${55 + (i % 3) * 15}%` }} />
      <div className={cx(skeleton.block, styles.skDate)} />
    </div>
    <div className={cx(skeleton.block, styles.skAmount)} />
  </div>
));

const EmptyState = ({ hasAnyTransactions, monthName, onClearFilters }) => (
  <div className={styles.empty}>
    {!hasAnyTransactions ? (
      <>
        <div className={styles.emptyIcon} aria-hidden="true">📭</div>
        <div>No expenses in {monthName}</div>
        <div className={styles.emptyHint}>Tap + to add your first one</div>
      </>
    ) : (
      <>
        <div className={styles.emptyIcon} aria-hidden="true">🔍</div>
        <div>No results match your filters</div>
        <button className={styles.linkButton} onClick={onClearFilters}>Clear filters</button>
      </>
    )}
  </div>
);

const LoadError = ({ onRetry }) => (
  <div className={styles.empty}>
    <div className={styles.emptyIcon} aria-hidden="true">⚠️</div>
    <div>Couldn't load transactions</div>
    <button className={styles.linkButton} onClick={() => onRetry()}>Try again</button>
  </div>
);

const TransactionList = ({
  transactions,
  isLoading,
  loadFailed,
  onRetry,
  hasAnyTransactions,
  monthName,
  sortBy,
  sortDirection,
  onSort,
  onClearFilters,
  onDelete,
  onEdit,
  isRecurring,
  onToggleRecurring,
}) => {
  // Only one card can be expanded or swiped open at a time
  const [expandedId, setExpandedId] = useState(null);
  const [swipedId, setSwipedId] = useState(null);

  const handleTap = (id) => {
    if (swipedId !== null) { setSwipedId(null); return; }
    setExpandedId(current => current === id ? null : id);
  };

  const handleSwipeOpen = (id) => {
    setSwipedId(id);
    setExpandedId(null);
  };

  // The page hides the row and offers Undo, so there is no confirm step
  const handleDelete = (t) => {
    setSwipedId(null);
    setExpandedId(null);
    onDelete(t);
  };

  const renderBody = () => {
    if (isLoading) return <SkeletonCards />;
    if (loadFailed) return <LoadError onRetry={onRetry} />;
    if (transactions.length === 0) {
      return <EmptyState hasAnyTransactions={hasAnyTransactions} monthName={monthName} onClearFilters={onClearFilters} />;
    }

    const renderCard = (t, showDate) => (
      <TransactionCard
        key={t.id}
        transaction={t}
        showDate={showDate}
        isExpanded={expandedId === t.id}
        isSwiped={swipedId === t.id}
        isRecurring={isRecurring(t.id)}
        onTap={() => handleTap(t.id)}
        onSwipeOpen={() => handleSwipeOpen(t.id)}
        onSwipeClose={() => setSwipedId(null)}
        onDelete={() => handleDelete(t)}
        onEdit={() => { setExpandedId(null); onEdit(t); }}
        onToggleRecurring={() => onToggleRecurring(t)}
      />
    );

    // Sorted by amount, rows from different days mix, so each row shows its own date
    if (sortBy !== 'date') return transactions.map(t => renderCard(t, true));

    return groupByDay(transactions).map(group => (
      <section key={group.date || 'no-date'} className={styles.day} aria-label={formatDayHeading(group.date)}>
        <div className={styles.dayHeader}>
          <span>{formatDayHeading(group.date)}</span>
          <span>₹{formatAmount(group.total)}</span>
        </div>
        {group.items.map(t => renderCard(t, false))}
      </section>
    ));
  };

  return (
    <div className={styles.list}>
      <div className={styles.header}>
        <div className={styles.sectionLabel}>Transactions</div>
        <SortButtons sortBy={sortBy} sortDirection={sortDirection} onSort={onSort} />
      </div>
      {renderBody()}
    </div>
  );
};

export default TransactionList;
