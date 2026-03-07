import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from './contexts/AuthContext.js';
import Loader from './components/Loader.js';
import AddTransaction from './components/AddTransaction.js';
import EditTransaction from './components/EditTransaction.js';
import { addAnimationStyles } from './utils/animations.js';
import { formatDate } from './utils/formatters.js';
import { getCategoryColor, getCategoryIcon } from './utils/categoryUtils.js';
import { formatAmount } from './utils/formatters.js';
import { sortData } from './utils/dataUtils.js';
import { getAuthData, apiPost } from './utils/api.js';
import { getRecurringTemplates, addRecurringTemplate, removeRecurringTemplate, markHandled, getPendingSuggestions } from './utils/recurringUtils.js';
import RecurringSuggestions from './components/RecurringSuggestions.js';
import ManageRecurring from './components/ManageRecurring.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ExpenseTable = () => {
  const { logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCard, setExpandedCard] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
  const [swipedCard, setSwipedCard] = useState(null);
  const touchRef = useRef({ startX: 0, startY: 0, wasSwiped: false });
  const [showFilters, setShowFilters] = useState(false);
  const [showManageRecurring, setShowManageRecurring] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [recurringTemplates, setRecurringTemplates] = useState(() => getRecurringTemplates());
  const [addingRecurringId, setAddingRecurringId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const performDelete = async (row, index) => {
    setSwipedCard(null);
    setDeletingIndex(index);
    try {
      const userData = getAuthData();
      await apiPost('/api/delete-transaction', {
        pageId: row.id,
        userName: userData?.userName || '',
        uuid: userData?.uuid || '',
      });
      setOriginalData(prev => prev.filter((_, i) => i !== index));
      setExpandedCard(null);
    } catch (err) {
      console.error('Delete failed', err);
      setDeleteError(true);
      setTimeout(() => setDeleteError(false), 3000);
    }
    finally { setDeletingIndex(null); }
  };

  const handleDelete = async (e, row, index) => {
    e.stopPropagation();
    if (deleteConfirm !== index) { setDeleteConfirm(index); return; }
    setDeleteConfirm(null);
    await performDelete(row, index);
  };

  const handleTouchStart = (e, index) => {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, wasSwiped: false };
  };

  const handleTouchEnd = (e, index) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.startY);
    if (dy > 30) return; // vertical scroll, ignore
    if (dx < -60) {
      touchRef.current.wasSwiped = true;
      setSwipedCard(index);
      setExpandedCard(null);
      setDeleteConfirm(null);
    } else if (dx > 20 && swipedCard === index) {
      touchRef.current.wasSwiped = true;
      setSwipedCard(null);
    }
  };

  const handleToggleRecurring = (transaction) => {
    const existing = recurringTemplates.find(t => t.sourceId === transaction.id);
    if (existing) {
      setRecurringTemplates(removeRecurringTemplate(existing.id));
    } else {
      setRecurringTemplates(addRecurringTemplate(transaction));
    }
  };

  const handleConfirmSuggestion = async (suggestion) => {
    setAddingRecurringId(suggestion.id);
    try {
      const userData = getAuthData();
      const now = new Date();
      const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === (now.getMonth() + 1);
      const day = isCurrentMonth ? now.getDate() : 1;
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const response = await apiPost('/api/transaction', {
        userName: userData?.userName || '',
        uuid: userData?.uuid || '',
        isMe: userData?.isMe || false,
        expense: suggestion.expense,
        amount: suggestion.amount,
        date: dateStr,
        category: suggestion.category,
        paymentMethod: suggestion.paymentMethod,
      });
      if (response.ok) {
        setRecurringTemplates(markHandled(suggestion.id, selectedYear, selectedMonth));
        setRefreshKey(k => k + 1);
      }
    } catch (err) {
      console.error('Failed to add recurring transaction', err);
    } finally {
      setAddingRecurringId(null);
    }
  };

  const handleSkipSuggestion = (templateId) => {
    setRecurringTemplates(markHandled(templateId, selectedYear, selectedMonth));
  };

  useEffect(() => { addAnimationStyles(); }, []);

  useEffect(() => {
    if (showAddTransaction) return;
    setIsLoading(true);
    const userData = getAuthData();
    const base = { userName: userData?.userName || '', uuid: userData?.uuid || '', isMe: userData?.isMe || false, month: selectedMonth, year: selectedYear };
    const apiCalls = [
      apiPost('/api/notion', { ...base, type: 'default' }).then(r => r.json()),
    ];
    if (userData?.isMe) {
      apiCalls.push(
        apiPost('/api/notion', { ...base, type: 'cc' }).then(r => r.json()).catch(() => ({ results: [] }))
      );
    }
    const parse = (results) => results.map(row => ({
      id: row.id,
      expense: row.properties.Expense?.title?.[0]?.text?.content || '—',
      amount: row.properties.Amount?.number || 0,
      date: formatDate(row.properties.Date?.date?.start),
      category: row.properties.Category?.select?.name || 'Other',
      paymentMethod: row.properties['Payment Method']?.select?.name || 'Other',
    }));
    Promise.all(apiCalls).then(results => {
      const combined = [...parse(results[0].results), ...(results[1] ? parse(results[1].results) : [])];
      setOriginalData(combined);
      setRows(sortData([...combined], sortBy, sortDirection));
      setSelectedCategory('All');
      setSelectedPaymentMethod('All');
      setIsLoading(false);
    }).catch(() => { setOriginalData([]); setRows([]); setIsLoading(false); });
  }, [showAddTransaction, selectedMonth, selectedYear, refreshKey]);

  useEffect(() => {
    let filtered = originalData;
    if (selectedCategory !== 'All') filtered = filtered.filter(r => r.category === selectedCategory);
    if (selectedPaymentMethod !== 'All') filtered = filtered.filter(r => r.paymentMethod === selectedPaymentMethod);
    if (searchTerm) filtered = filtered.filter(r => r.expense.toLowerCase().includes(searchTerm.toLowerCase()));
    setRows(sortData([...filtered], sortBy, sortDirection));
  }, [selectedCategory, selectedPaymentMethod, searchTerm, sortBy, sortDirection, originalData]);

  const categories = ['All', ...new Set(originalData.map(r => r.category))];
  const paymentMethods = ['All', ...new Set(originalData.map(r => r.paymentMethod))];
  const pendingSuggestions = getPendingSuggestions(recurringTemplates, selectedYear, selectedMonth);
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const categoryBreakdown = originalData.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = { total: 0, count: 0 };
    acc[r.category].total += r.amount;
    acc[r.category].count += 1;
    return acc;
  }, {});

  if (isLoading) return <Loader message="Loading Your Expenses" subMessage="Fetching data from Notion database" size="large" />;

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

        /* Add button */
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

          {/* Header */}
          <div className="et-header">
            <div className="et-header-left">
              <h1>💰 Expense Tracker</h1>
              <p>Track your expenses from Notion</p>
            </div>
            <button className="et-logout" onClick={logout}>🚪 Logout</button>
          </div>

          {/* Controls */}
          <div className="et-controls">

            {/* Row 1: Month + Add button side by side */}
            <div className="et-row">
              <div className="et-month-wrap">
                <span className="et-month-icon">📅</span>
                <select
                  className="et-month-select"
                  value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-');
                    setSelectedYear(parseInt(y));
                    setSelectedMonth(parseInt(m));
                  }}
                >
                  {Array.from({ length: 10 }, (_, yi) => {
                    const y = new Date().getFullYear() - 5 + yi;
                    return Array.from({ length: 12 }, (_, mi) => {
                      const m = mi + 1;
                      return (
                        <option key={`${y}-${m}`} value={`${y}-${m.toString().padStart(2, '0')}`}>
                          {MONTH_NAMES[mi]} {y}
                        </option>
                      );
                    });
                  }).flat()}
                </select>
              </div>
              <button className="et-add-btn" onClick={() => setShowAddTransaction(true)}>
                ＋ Add
              </button>
            </div>

            {/* Row 2: Search + Total side by side */}
            <div className="et-row">
              <div className="et-search">
                <span className="et-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="et-total">
                <div className="et-total-amount">₹{formatAmount(totalAmount)}</div>
                <div className="et-total-label">{rows.length}/{originalData.length} expenses</div>
              </div>
            </div>

            {/* Filter row: toggle button + active chips */}
            {(() => {
              const activeCount = (selectedCategory !== 'All' ? 1 : 0) + (selectedPaymentMethod !== 'All' ? 1 : 0);
              return (
                <div className="et-filter-row">
                  <button
                    className={`et-filter-toggle${activeCount > 0 ? ' has-filters' : ''}`}
                    onClick={() => setShowFilters(f => !f)}
                  >
                    ⚙ Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
                  </button>
                  {selectedCategory !== 'All' && (
                    <button className="et-active-chip" onClick={() => setSelectedCategory('All')}>
                      {getCategoryIcon(selectedCategory)} {selectedCategory} <span className="et-chip-x">×</span>
                    </button>
                  )}
                  {selectedPaymentMethod !== 'All' && (
                    <button className="et-active-chip" onClick={() => setSelectedPaymentMethod('All')}>
                      💳 {selectedPaymentMethod} <span className="et-chip-x">×</span>
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Collapsible filter panel */}
            {showFilters && (
              <div className="et-filter-panel">
                <div className="et-filter-section">
                  <div className="et-filter-section-label">Category</div>
                  <div className="et-cats">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`et-cat-btn${selectedCategory === cat ? ' active' : ''}`}
                        onClick={() => { setSelectedCategory(cat); setShowFilters(false); }}
                      >
                        {cat === 'All' ? '🗂' : getCategoryIcon(cat)} {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {paymentMethods.length > 1 && (
                  <div className="et-filter-section">
                    <div className="et-filter-section-label">Payment Method</div>
                    <div className="et-cats">
                      {paymentMethods.map(pm => (
                        <button
                          key={pm}
                          className={`et-cat-btn${selectedPaymentMethod === pm ? ' active' : ''}`}
                          onClick={() => { setSelectedPaymentMethod(pm); setShowFilters(false); }}
                        >
                          {pm === 'All' ? '💳' : pm}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Breakdown toggle */}
            <button className={`et-breakdown-btn${showBreakdown ? ' open' : ''}`} onClick={() => setShowBreakdown(!showBreakdown)}>
              <span>📊 Category Breakdown</span>
              <span style={{ fontSize: '11px' }}>{showBreakdown ? '▲' : '▼'}</span>
            </button>

            {/* Category breakdown */}
            {showBreakdown && (
              <div className="et-breakdown">
                <h3>💰 Spending by Category</h3>
                <div className="et-breakdown-grid">
                  {Object.entries(categoryBreakdown).map(([cat, data]) => (
                    <div
                      key={cat}
                      className="et-breakdown-card"
                      style={{ background: getCategoryColor(cat) }}
                    >
                      <div className="bc-icon">{getCategoryIcon(cat)}</div>
                      <div className="bc-cat">{cat}</div>
                      <div className="bc-amt">₹{data.total.toFixed(0)}</div>
                      <div className="bc-count">{data.count} items</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recurring suggestions */}
          <RecurringSuggestions
            suggestions={pendingSuggestions}
            onConfirm={handleConfirmSuggestion}
            onSkip={handleSkipSuggestion}
            addingId={addingRecurringId}
            allTemplatesCount={recurringTemplates.length}
            onManage={() => setShowManageRecurring(true)}
          />

          {/* Transaction list */}
          <div className="et-list">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
              <div className="et-section-label">Transactions</div>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[{ key: 'date', label: '📅 Date' }, { key: 'amount', label: '₹ Amount' }].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (sortBy === key) setSortDirection(d => d === 'desc' ? 'asc' : 'desc');
                      else { setSortBy(key); setSortDirection('desc'); }
                    }}
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
            </div>

            {rows.length === 0 ? (
              <div className="et-empty">
                {originalData.length === 0 ? (
                  <>
                    <div className="et-empty-icon">📭</div>
                    <div>No expenses in {MONTH_NAMES[selectedMonth - 1]}</div>
                    <div style={{ fontSize: '11px', marginTop: '5px', color: '#c0c4d0' }}>Tap + Add to record your first one</div>
                  </>
                ) : (
                  <>
                    <div className="et-empty-icon">🔍</div>
                    <div>No results match your filters</div>
                    <button
                      onClick={() => { setSelectedCategory('All'); setSelectedPaymentMethod('All'); }}
                      style={{ marginTop: '8px', background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            ) : rows.map((r, i) => (
              <div key={i} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  className="et-swipe-delete"
                  onClick={(e) => { e.stopPropagation(); performDelete(r, i); }}
                >
                  🗑 Delete
                </div>
              <div
                className={`et-tx${expandedCard === i ? ' expanded' : ''}${deletingIndex === i ? ' et-deleting' : ''}`}
                style={{
                  borderLeftColor: getCategoryColor(r.category),
                  transform: `translateX(${swipedCard === i ? -82 : 0}px)`,
                  transition: 'transform 0.25s ease',
                }}
                onTouchStart={(e) => handleTouchStart(e, i)}
                onTouchEnd={(e) => handleTouchEnd(e, i)}
                onClick={() => {
                  if (touchRef.current.wasSwiped) { touchRef.current.wasSwiped = false; return; }
                  if (swipedCard === i) { setSwipedCard(null); return; }
                  if (swipedCard !== null) { setSwipedCard(null); return; }
                  setExpandedCard(expandedCard === i ? null : i);
                  setDeleteConfirm(null);
                }}
              >
                {/* Collapsed row */}
                <div className="et-tx-row">
                  <div className="et-tx-icon" style={{ background: `${getCategoryColor(r.category)}18` }}>
                    {getCategoryIcon(r.category)}
                  </div>
                  <div className="et-tx-info">
                    <div className="et-tx-name">{r.expense}</div>
                    <div className="et-tx-date">{r.date}</div>
                  </div>
                  <div className="et-tx-amount">₹{formatAmount(r.amount)}</div>
                </div>

                {/* Expanded details */}
                {expandedCard === i && (
                  <div className="et-expanded-inner">
                    <div className="et-expanded-chip">
                      <div className="et-expanded-label">Category</div>
                      <div className="et-expanded-val" style={{ color: getCategoryColor(r.category) }}>{r.category}</div>
                    </div>
                    <div className="et-expanded-chip">
                      <div className="et-expanded-label">Amount</div>
                      <div className="et-expanded-val" style={{ color: '#ef4444', fontFamily: 'DM Mono, monospace' }}>₹{formatAmount(r.amount)}</div>
                    </div>
                    <div className="et-expanded-chip">
                      <div className="et-expanded-label">Date</div>
                      <div className="et-expanded-val">{r.date}</div>
                    </div>
                    <div className="et-expanded-chip">
                      <div className="et-expanded-label">Description</div>
                      <div className="et-expanded-val">{r.expense}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleRecurring(r); }}
                        style={{
                          width: '100%',
                          background: recurringTemplates.some(t => t.sourceId === r.id) ? '#ede9ff' : '#f3f4f6',
                          color: recurringTemplates.some(t => t.sourceId === r.id) ? '#4f46e5' : '#6b7280',
                          border: recurringTemplates.some(t => t.sourceId === r.id) ? '1.5px solid #c4b5fd' : '1.5px solid transparent',
                          borderRadius: '9px', padding: '7px 10px',
                          fontSize: '12px', fontWeight: 700,
                          fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          transition: 'all 0.15s',
                        }}
                      >
                        🔄 {recurringTemplates.some(t => t.sourceId === r.id) ? 'Remove from recurring' : 'Set as recurring'}
                      </button>
                    </div>

                    <div className="et-expanded-footer">
                      <span className="et-expanded-hint">Tap to collapse</span>
                      <div className="et-action-group">
                        {deleteConfirm === i ? (
                          <>
                            <button
                              className="et-cancel-delete-btn"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                            >
                              Cancel
                            </button>
                            <button
                              className="et-delete-confirm-btn"
                              onClick={(e) => handleDelete(e, r, i)}
                            >
                              🗑 Sure?
                            </button>
                          </>
                        ) : (
                          <button
                            className="et-delete-btn"
                            onClick={(e) => handleDelete(e, r, i)}
                          >
                            🗑 Delete
                          </button>
                        )}
                        <button
                          className="et-edit-btn"
                          onClick={(e) => { e.stopPropagation(); setEditingTransaction(r); setExpandedCard(null); }}
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {showAddTransaction && (
        <AddTransaction
          onClose={() => setShowAddTransaction(false)}
          onTransactionAdded={() => { }}
        />
      )}

      {editingTransaction && (
        <EditTransaction
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onTransactionUpdated={(updated) => {
            setOriginalData(prev =>
              prev.map(r => r.id === updated.id ? { ...r, ...updated } : r)
            );
            setEditingTransaction(null);
          }}
        />
      )}

      {showManageRecurring && (
        <ManageRecurring
          templates={recurringTemplates}
          onClose={() => setShowManageRecurring(false)}
          onTemplatesChange={setRecurringTemplates}
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

export default ExpenseTable;