import { useMemo, useState } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { getAuthData } from '../auth/session.js';
import { MONTH_NAMES } from '../../shared/constants.js';
import { toISODate } from '../../shared/dates.js';
import AppHeader from '../../shared/AppHeader.jsx';
import TransactionForm from './TransactionForm.jsx';
import MonthPicker from './MonthPicker.jsx';
import SearchBox from './SearchBox.jsx';
import TotalCard from './TotalCard.jsx';
import Filters from './Filters.jsx';
import CategoryBreakdown from './CategoryBreakdown.jsx';
import TransactionList from './TransactionList.jsx';
import {
  useMonthTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useInvalidateTransactions,
} from './queries.js';
import { applyFilters, uniqueValues, totalByCategory } from './filtering.js';
import ImportTransactions from '../import/ImportTransactions.jsx';
import RecurringSuggestions from '../recurring/RecurringSuggestions.jsx';
import ManageRecurring from '../recurring/ManageRecurring.jsx';
import { useRecurring } from '../recurring/useRecurring.js';

const TransactionsPage = () => {
  const { logout } = useAuth();
  const currentUser = getAuthData();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const [modal, setModal] = useState(null); // 'add' | 'import' | 'recurring' | null
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteError, setDeleteError] = useState(false);
  const [addingRecurringId, setAddingRecurringId] = useState(null);

  const { data: transactions = [], isLoading, isError, refetch } = useMonthTransactions(month, year);
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const invalidateTransactions = useInvalidateTransactions();
  const recurring = useRecurring(year, month);

  const rows = useMemo(
    () => applyFilters(transactions, { category, paymentMethod, search, sortBy, sortDirection }),
    [transactions, category, paymentMethod, search, sortBy, sortDirection]
  );
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

  const handleMonthChange = (newMonth, newYear) => {
    setMonth(newMonth);
    setYear(newYear);
    setCategory('All');
    setPaymentMethod('All');
  };

  const handleSort = (key) => {
    if (sortBy === key) setSortDirection(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDirection('desc'); }
  };

  const clearFilters = () => { setCategory('All'); setPaymentMethod('All'); };

  // Resolves true when the row was deleted, so the list can collapse it
  const handleDelete = async (transaction) => {
    try {
      await deleteMutation.mutateAsync(transaction.id);
      return true;
    } catch (err) {
      console.error('Delete failed', err);
      setDeleteError(true);
      setTimeout(() => setDeleteError(false), 3000);
      return false;
    }
  };

  const handleConfirmSuggestion = (suggestion) => {
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const day = isCurrentMonth ? now.getDate() : 1;
    setAddingRecurringId(suggestion.id);
    createMutation.mutate({
      expense: suggestion.expense,
      amount: suggestion.amount,
      date: toISODate(new Date(year, month - 1, day)),
      category: suggestion.category,
      paymentMethod: suggestion.paymentMethod,
    }, {
      onSuccess: () => recurring.markHandled(suggestion.id),
      onError: err => console.error('Failed to add recurring transaction', err),
      onSettled: () => setAddingRecurringId(null),
    });
  };

  const closeModal = () => setModal(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .et-root {
          font-family: 'DM Sans', sans-serif;
          background: #eef0f5;
          min-height: 100vh;
          padding: 12px;
          display: flex;
          justify-content: center;
        }

        .et-app {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* ── HEADER ── */
        .et-header {
          background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 55%, #6366f1 100%);
          border-radius: 18px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .et-header-left h1 {
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .et-header-left p {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          margin-top: 1px;
        }
        .et-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .et-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
          letter-spacing: 0;
        }
        .et-logout {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.22);
          color: white;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s;
        }
        .et-logout:hover { background: rgba(255,255,255,0.22); }

        /* ── CONTROLS ── */
        .et-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Two-column row */
        .et-row {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }

        /* Month selector */
        .et-month-wrap {
          background: #fff;
          border-radius: 12px;
          padding: 0 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          flex: 1;
          min-width: 0;
        }
        .et-month-icon { font-size: 14px; flex-shrink: 0; }
        .et-month-select {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #1a1a2e;
          padding: 9px 0;
          background: transparent;
          cursor: pointer;
          min-width: 0;
        }

        /* Add / Import buttons */
        .et-btn-group { display: flex; gap: 6px; flex-shrink: 0; }
        .et-add-btn {
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 9px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: opacity 0.2s, transform 0.15s;
        }
        .et-add-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .et-import-btn {
          background: #fff;
          color: #4f46e5;
          border: 1.5px solid #c4b5fd;
          border-radius: 12px;
          padding: 9px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .et-import-btn:hover { background: #ede9ff; transform: translateY(-1px); }

        /* Search */
        .et-search {
          background: #fff;
          border-radius: 12px;
          padding: 8px 11px;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          flex: 1;
          min-width: 0;
        }
        .et-search input {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #1a1a2e;
          background: transparent;
          min-width: 0;
        }
        .et-search input::placeholder { color: #a0a4b8; }
        .et-search-icon { color: #a0a4b8; font-size: 12px; flex-shrink: 0; }

        /* Total card */
        .et-total {
          background: linear-gradient(135deg, #15803d, #22c55e);
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          min-width: 120px;
        }
        .et-total-label { font-size: 10px; color: rgba(255,255,255,0.7); font-weight: 600; }
        .et-total-amount {
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          font-weight: 600;
          color: white;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 130px;
        }

        /* Category filters */
        .et-cats {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 1px;
        }
        .et-cats::-webkit-scrollbar { display: none; }
        .et-cat-btn {
          background: #fff;
          border: 1.5px solid transparent;
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .et-cat-btn.active {
          background: #ede9ff;
          border-color: #4f46e5;
          color: #4f46e5;
        }

        /* Filter row */
        .et-filter-row {
          display: flex;
          gap: 6px;
          align-items: center;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .et-filter-row::-webkit-scrollbar { display: none; }
        .et-filter-toggle {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: all 0.15s;
        }
        .et-filter-toggle.has-filters {
          border-color: #4f46e5;
          color: #4f46e5;
          background: #ede9ff;
        }
        .et-active-chip {
          background: #ede9ff;
          border: 1.5px solid #c4b5fd;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #4f46e5;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s;
        }
        .et-active-chip:hover { background: #ddd6fe; }
        .et-chip-x { font-size: 13px; opacity: 0.6; line-height: 1; }

        /* Filter panel */
        .et-filter-panel {
          background: #fff;
          border-radius: 14px;
          padding: 12px 14px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .et-filter-section { display: flex; flex-direction: column; gap: 6px; }
        .et-filter-section-label {
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Sort controls */
        .et-sort-row {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .et-sort-label {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .et-sort-btn {
          background: #fff;
          border: 1.5px solid transparent;
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .et-sort-btn.active {
          background: #ede9ff;
          border-color: #4f46e5;
          color: #4f46e5;
        }
        .et-dir-btn {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 20px;
          padding: 5px 10px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          color: #4f46e5;
          font-weight: 700;
          transition: all 0.15s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          flex-shrink: 0;
          margin-left: auto;
        }
        .et-dir-btn:hover { background: #ede9ff; border-color: #4f46e5; }

        /* Breakdown toggle */
        .et-breakdown-btn {
          background: #fff;
          color: #6b7280;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 8px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
          text-align: left;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .et-breakdown-btn:hover { border-color: #c4b5fd; color: #4f46e5; }
        .et-breakdown-btn.open { border-color: #c4b5fd; color: #4f46e5; background: #ede9ff; }

        /* Delete error toast */
        .et-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a2e;
          color: white;
          padding: 10px 18px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          z-index: 99999;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          animation: et-toast-in 0.2s ease;
          white-space: nowrap;
        }
        @keyframes et-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* Breakdown grid */
        .et-breakdown {
          background: #fff;
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }
        .et-breakdown h3 {
          font-size: 13px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 10px;
        }
        .et-breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
        }
        .et-breakdown-card {
          border-radius: 12px;
          padding: 10px;
          text-align: center;
          color: white;
          transition: transform 0.15s;
          cursor: default;
        }
        .et-breakdown-card:hover { transform: translateY(-2px); }
        .et-breakdown-card .bc-icon { font-size: 18px; margin-bottom: 4px; }
        .et-breakdown-card .bc-cat { font-size: 10px; font-weight: 700; margin-bottom: 3px; opacity: 0.9; }
        .et-breakdown-card .bc-amt { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 600; }
        .et-breakdown-card .bc-count { font-size: 10px; opacity: 0.75; margin-top: 2px; }

        /* Transaction list */
        .et-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .et-section-label {
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 0 2px;
        }

        .et-tx {
          background: #fff;
          border-radius: 14px;
          padding: 11px 14px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          border-left: 3px solid transparent;
        }
        .et-tx:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
        .et-tx.expanded { box-shadow: 0 6px 20px rgba(0,0,0,0.12); }

        .et-tx-row {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .et-tx-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .et-tx-info { flex: 1; min-width: 0; }
        .et-tx-name {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a2e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .et-tx-date { font-size: 11px; color: #9ca3af; margin-top: 1px; }
        .et-tx-amount {
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          color: #ef4444;
          flex-shrink: 0;
        }

        /* Expanded details */
        .et-expanded-inner {
          border-top: 1px dashed #f0f0f0;
          margin-top: 10px;
          padding-top: 8px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .et-expanded-chip {
          background: #f8f9fb;
          border-radius: 9px;
          padding: 7px 10px;
        }
        .et-expanded-label {
          font-size: 10px;
          color: #a0a4b8;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 2px;
        }
        .et-expanded-val {
          font-size: 13px;
          color: #1a1a2e;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .et-expanded-footer {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
        }
        .et-expanded-hint {
          font-size: 10px;
          color: #c0c4d0;
        }
        .et-edit-btn {
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 5px 11px;
          font-size: 11px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: opacity 0.2s;
        }
        .et-edit-btn:hover { opacity: 0.85; }
        .et-delete-btn {
          background: #fff0f0;
          color: #ef4444;
          border: 1.5px solid #fecaca;
          border-radius: 8px;
          padding: 5px 11px;
          font-size: 11px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s;
        }
        .et-delete-btn:hover { background: #fee2e2; }
        .et-delete-confirm-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 5px 11px;
          font-size: 11px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          animation: et-shake 0.3s ease;
          transition: opacity 0.2s;
        }
        .et-delete-confirm-btn:hover { opacity: 0.88; }
        .et-cancel-delete-btn {
          background: transparent;
          color: #9ca3af;
          border: none;
          font-size: 11px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          padding: 5px 6px;
          text-decoration: underline;
        }
        .et-action-group { display: flex; align-items: center; gap: 5px; }
        @keyframes et-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .et-deleting { opacity: 0.4; pointer-events: none; transition: opacity 0.3s; }
          gap: 4px;
          transition: opacity 0.2s;
        }
        .et-edit-btn:hover { opacity: 0.85; }

        /* Swipe delete */
        .et-swipe-delete {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 82px;
          background: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          border-radius: 14px;
          gap: 4px;
        }
        .et-swipe-delete:active { background: #dc2626; }

        /* Skeleton */
        @keyframes et-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .et-skeleton-card {
          background: #fff;
          border-radius: 14px;
          padding: 11px 14px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .et-sk {
          background: linear-gradient(90deg, #f0f1f5 25%, #e4e6ed 50%, #f0f1f5 75%);
          background-size: 200% 100%;
          animation: et-shimmer 1.4s ease-in-out infinite;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .et-sk-circle { border-radius: 9px; width: 34px; height: 34px; }
        .et-sk-info { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }

        /* Empty state */
        .et-empty {
          background: #fff;
          border-radius: 14px;
          padding: 32px 16px;
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }
        .et-empty-icon { font-size: 32px; margin-bottom: 8px; }
      `}</style>

      <div className="et-root">
        <div className="et-app">
          <AppHeader userName={currentUser?.userName} onLogout={logout} />

          <div className="et-controls">
            {/* Month + Import/Add */}
            <div className="et-row">
              <MonthPicker month={month} year={year} onChange={handleMonthChange} />
              <div className="et-btn-group">
                <button className="et-import-btn" onClick={() => setModal('import')}>
                  📥 Import
                </button>
                <button className="et-add-btn" onClick={() => setModal('add')}>
                  ＋ Add
                </button>
              </div>
            </div>

            {/* Search + Total */}
            <div className="et-row">
              <SearchBox value={search} onChange={setSearch} />
              <TotalCard isLoading={isLoading} total={totalAmount} shownCount={rows.length} totalCount={transactions.length} />
            </div>

            <Filters
              categories={uniqueValues(transactions, 'category')}
              paymentMethods={uniqueValues(transactions, 'paymentMethod')}
              category={category}
              paymentMethod={paymentMethod}
              onCategoryChange={setCategory}
              onPaymentMethodChange={setPaymentMethod}
            />

            <CategoryBreakdown breakdown={totalByCategory(transactions)} />
          </div>

          <RecurringSuggestions
            suggestions={recurring.pending}
            onConfirm={handleConfirmSuggestion}
            onSkip={recurring.markHandled}
            addingId={addingRecurringId}
            allTemplatesCount={recurring.templates.length}
            onManage={() => setModal('recurring')}
          />

          <TransactionList
            transactions={rows}
            isLoading={isLoading}
            loadFailed={isError}
            onRetry={refetch}
            hasAnyTransactions={transactions.length > 0}
            monthName={MONTH_NAMES[month - 1]}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            onClearFilters={clearFilters}
            deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
            onDelete={handleDelete}
            onEdit={setEditingTransaction}
            isRecurring={recurring.isRecurring}
            onToggleRecurring={recurring.toggle}
          />
        </div>
      </div>

      {modal === 'add' && (
        <TransactionForm
          onSubmit={values => createMutation.mutateAsync(values)}
          onClose={closeModal}
        />
      )}

      {modal === 'import' && (
        <ImportTransactions
          onClose={closeModal}
          onImported={() => { closeModal(); invalidateTransactions(); }}
        />
      )}

      {modal === 'recurring' && (
        <ManageRecurring
          templates={recurring.templates}
          onClose={closeModal}
          onTemplatesChange={recurring.setTemplates}
        />
      )}

      {editingTransaction && (
        <TransactionForm
          transaction={editingTransaction}
          onSubmit={changes => updateMutation.mutateAsync({ id: editingTransaction.id, changes })}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {deleteError && (
        <div className="et-toast">
          ⚠️ Couldn't delete — please try again
        </div>
      )}
    </>
  );
};

export default TransactionsPage;
