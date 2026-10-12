import { useState } from 'react';
import TransactionCard from './TransactionCard.jsx';

const SORT_OPTIONS = [{ key: 'date', label: '📅 Date' }, { key: 'amount', label: '₹ Amount' }];

const SortButtons = ({ sortBy, sortDirection, onSort }) => (
  <div style={{ display: 'flex', gap: '5px' }}>
    {SORT_OPTIONS.map(({ key, label }) => (
      <button
        key={key}
        onClick={() => onSort(key)}
        style={{
          background: sortBy === key ? '#ede9ff' : 'transparent',
          border: sortBy === key ? '1.5px solid #c4b5fd' : '1.5px solid transparent',
          borderRadius: '12px',
          padding: '3px 9px',
          fontSize: '11px',
          fontWeight: 700,
          color: sortBy === key ? '#4f46e5' : '#9ca3af',
          fontFamily: "'DM Sans', sans-serif",
          cursor: 'pointer',
        }}
      >
        {label} {sortBy === key ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
      </button>
    ))}
  </div>
);

const SkeletonCards = () => Array.from({ length: 5 }).map((_, i) => (
  <div key={i} className="et-skeleton-card">
    <div className="et-sk et-sk-circle" />
    <div className="et-sk-info">
      <div className="et-sk" style={{ height: '13px', width: `${55 + (i % 3) * 15}%` }} />
      <div className="et-sk" style={{ height: '11px', width: '35%' }} />
    </div>
    <div className="et-sk" style={{ height: '14px', width: '52px' }} />
  </div>
));

const EmptyState = ({ hasAnyTransactions, monthName, onClearFilters }) => (
  <div className="et-empty">
    {!hasAnyTransactions ? (
      <>
        <div className="et-empty-icon">📭</div>
        <div>No expenses in {monthName}</div>
        <div style={{ fontSize: '11px', marginTop: '5px', color: '#c0c4d0' }}>Tap + Add to record your first one</div>
      </>
    ) : (
      <>
        <div className="et-empty-icon">🔍</div>
        <div>No results match your filters</div>
        <button
          onClick={onClearFilters}
          style={{ marginTop: '8px', background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', textDecoration: 'underline' }}
        >
          Clear filters
        </button>
      </>
    )}
  </div>
);

const TransactionList = ({
  transactions,
  isLoading,
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
    <div className="et-list">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <div className="et-section-label">Transactions</div>
        <SortButtons sortBy={sortBy} sortDirection={sortDirection} onSort={onSort} />
      </div>
      {renderBody()}
    </div>
  );
};

export default TransactionList;
