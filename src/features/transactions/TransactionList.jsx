import { useState } from 'react';
import TransactionCard from './TransactionCard.jsx';
import { cx } from '../../shared/cx.js';
import skeleton from '../../shared/Skeleton.module.css';
import styles from './TransactionList.module.css';

const SORT_OPTIONS = [{ key: 'date', label: '📅 Date' }, { key: 'amount', label: '₹ Amount' }];

const SortButtons = ({ sortBy, sortDirection, onSort }) => (
  <div className={styles.sortButtons}>
    {SORT_OPTIONS.map(({ key, label }) => (
      <button key={key} className={cx(styles.sortBtn, sortBy === key && styles.active)} onClick={() => onSort(key)}>
        {label} {sortBy === key ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
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
        <div className={styles.emptyIcon}>📭</div>
        <div>No expenses in {monthName}</div>
        <div className={styles.emptyHint}>Tap + Add to record your first one</div>
      </>
    ) : (
      <>
        <div className={styles.emptyIcon}>🔍</div>
        <div>No results match your filters</div>
        <button className={styles.linkButton} onClick={onClearFilters}>Clear filters</button>
      </>
    )}
  </div>
);

const LoadError = ({ onRetry }) => (
  <div className={styles.empty}>
    <div className={styles.emptyIcon}>⚠️</div>
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
  deletingId,
  onDelete,
  onEdit,
  isRecurring,
  onToggleRecurring,
}) => {
  // Only one card can be expanded, swiped open, or asking to confirm a delete at a time
  const [expandedId, setExpandedId] = useState(null);
  const [swipedId, setSwipedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleTap = (id) => {
    if (swipedId !== null) { setSwipedId(null); return; }
    setExpandedId(current => current === id ? null : id);
    setConfirmDeleteId(null);
  };

  const handleSwipeOpen = (id) => {
    setSwipedId(id);
    setExpandedId(null);
    setConfirmDeleteId(null);
  };

  const handleDelete = async (t) => {
    setSwipedId(null);
    setConfirmDeleteId(null);
    if (await onDelete(t)) setExpandedId(null);
  };

  const renderBody = () => {
    if (isLoading) return <SkeletonCards />;
    if (loadFailed) return <LoadError onRetry={onRetry} />;
    if (transactions.length === 0) {
      return <EmptyState hasAnyTransactions={hasAnyTransactions} monthName={monthName} onClearFilters={onClearFilters} />;
    }
    return transactions.map(t => (
      <TransactionCard
        key={t.id}
        transaction={t}
        isExpanded={expandedId === t.id}
        isSwiped={swipedId === t.id}
        isConfirmingDelete={confirmDeleteId === t.id}
        isDeleting={deletingId === t.id}
        isRecurring={isRecurring(t.id)}
        onTap={() => handleTap(t.id)}
        onSwipeOpen={() => handleSwipeOpen(t.id)}
        onSwipeClose={() => setSwipedId(null)}
        onRequestDelete={() => setConfirmDeleteId(t.id)}
        onCancelDelete={() => setConfirmDeleteId(null)}
        onDelete={() => handleDelete(t)}
        onEdit={() => { setExpandedId(null); onEdit(t); }}
        onToggleRecurring={() => onToggleRecurring(t)}
      />
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
