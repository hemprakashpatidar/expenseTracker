import { useState } from 'react';
import TransactionCard from './TransactionCard.jsx';
import { cx } from '../../shared/cx.js';
import Icon from '../../shared/Icon.jsx';
import { formatAmount } from '../../shared/formatters.js';
import { formatDayHeading } from '../../shared/dates.js';
import { groupByDay } from './filtering.js';
import skeleton from '../../shared/Skeleton.module.css';
import styles from './TransactionList.module.css';

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Highest amount' },
  { value: 'amount-asc', label: 'Lowest amount' },
];

// The current order as a text button; a transparent native <select> on top picks another
const SortControl = ({ sortBy, sortDirection, onSortChange }) => {
  const value = `${sortBy}-${sortDirection}`;
  const current = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0];
  return (
    <label className={styles.sort}>
      <Icon name="sort" size={16} />
      <span aria-hidden="true">{current.label}</span>
      <select
        className={styles.sortSelect}
        aria-label="Sort expenses"
        value={value}
        onChange={(e) => {
          const [nextSortBy, nextDirection] = e.target.value.split('-');
          onSortChange(nextSortBy, nextDirection);
        }}
      >
        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
};

const SkeletonRows = () => (
  <div className={styles.group}>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className={styles.skRow}>
        <div className={cx(skeleton.block, styles.skIcon)} />
        <div className={skeleton.info}>
          <div className={cx(skeleton.block, styles.skLine)} style={{ width: `${55 + (i % 3) * 15}%` }} />
          <div className={cx(skeleton.block, styles.skDate)} />
        </div>
        <div className={cx(skeleton.block, styles.skAmount)} />
      </div>
    ))}
  </div>
);

const EmptyState = ({ hasAnyTransactions, monthName, onClearFilters }) => (
  <div className={styles.empty}>
    {!hasAnyTransactions ? (
      <>
        <Icon name="inbox" size={32} strokeWidth={1.5} className={styles.emptyIcon} />
        <div>No expenses in {monthName}</div>
        <div className={styles.emptyHint}>Tap + to add your first one</div>
      </>
    ) : (
      <>
        <Icon name="search" size={32} strokeWidth={1.5} className={styles.emptyIcon} />
        <div>No results match your filters</div>
        <button className={styles.linkButton} onClick={onClearFilters}>Clear filters</button>
      </>
    )}
  </div>
);

const LoadError = ({ onRetry }) => (
  <div className={styles.empty}>
    <Icon name="alert" size={32} strokeWidth={1.5} className={styles.emptyIcon} />
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
  onSortChange,
  onClearFilters,
  onDelete,
  onEdit,
  isRecurring,
}) => {
  // Only one row can be swiped open at a time
  const [swipedId, setSwipedId] = useState(null);

  // While a row is swiped open, the next tap just closes it
  const handleOpen = (t) => {
    if (swipedId !== null) { setSwipedId(null); return; }
    onEdit(t);
  };

  // The page hides the row and offers Undo, so there is no confirm step
  const handleDelete = (t) => {
    setSwipedId(null);
    onDelete(t);
  };

  const renderBody = () => {
    if (isLoading) return <SkeletonRows />;
    if (loadFailed) return <LoadError onRetry={onRetry} />;
    if (transactions.length === 0) {
      return <EmptyState hasAnyTransactions={hasAnyTransactions} monthName={monthName} onClearFilters={onClearFilters} />;
    }

    const renderRow = (t, showDate) => (
      <TransactionCard
        key={t.id}
        transaction={t}
        showDate={showDate}
        isSwiped={swipedId === t.id}
        isRecurring={isRecurring(t.id)}
        onOpen={() => handleOpen(t)}
        onSwipeOpen={() => setSwipedId(t.id)}
        onSwipeClose={() => setSwipedId(null)}
        onDelete={() => handleDelete(t)}
      />
    );

    // Sorted by amount, rows from different days mix, so each row shows its own date
    if (sortBy !== 'date') return <ul className={styles.group}>{transactions.map(t => renderRow(t, true))}</ul>;

    return groupByDay(transactions).map(group => (
      <section key={group.date || 'no-date'} className={styles.day} aria-label={formatDayHeading(group.date)}>
        <div className={styles.dayHeader}>
          <span>{formatDayHeading(group.date)}</span>
          <span className={styles.dayTotal}>₹{formatAmount(group.total)}</span>
        </div>
        <ul className={styles.group}>{group.items.map(t => renderRow(t, false))}</ul>
      </section>
    ));
  };

  return (
    <div className={styles.list}>
      <div className={styles.header}>
        <h2 className={styles.sectionLabel}>{monthName}</h2>
        <SortControl sortBy={sortBy} sortDirection={sortDirection} onSortChange={onSortChange} />
      </div>
      {renderBody()}
    </div>
  );
};

export default TransactionList;
