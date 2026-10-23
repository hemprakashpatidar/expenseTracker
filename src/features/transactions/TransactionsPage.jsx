import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { getAuthData } from '../auth/session.js';
import { MONTH_NAMES } from '../../shared/constants.js';
import { toISODate } from '../../shared/dates.js';
import AppHeader from '../../shared/AppHeader.jsx';
import Fab from '../../shared/Fab.jsx';
import TransactionForm from './TransactionForm.jsx';
import MonthNav from './MonthNav.jsx';
import SearchBox from './SearchBox.jsx';
import MonthSummary from './MonthSummary.jsx';
import Filters from './Filters.jsx';
import SpendingBreakdown from './SpendingBreakdown.jsx';
import TransactionList from './TransactionList.jsx';
import {
  useMonthTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useInvalidateTransactions,
  useLatestTransactions,
  usePrefetchMonth,
} from './queries.js';
import { recentExpenses } from './addDefaults.js';
import { deleteTransaction } from '../../api/transactions.js';
import { useUndoableDelete } from './useUndoableDelete.js';
import UndoToast from './UndoToast.jsx';
import { cx } from '../../shared/cx.js';
import { applyFilters, uniqueValues, totalByCategory } from './filtering.js';
import ImportTransactions from '../import/ImportTransactions.jsx';
import RecurringSuggestions from '../recurring/RecurringSuggestions.jsx';
import ManageRecurring from '../recurring/ManageRecurring.jsx';
import { useRecurring } from '../recurring/useRecurring.js';
import page from '../../shared/Page.module.css';
import styles from './TransactionsPage.module.css';

const TransactionsPage = () => {
  const { logout } = useAuth();
  const currentUser = getAuthData();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const [modal, setModal] = useState(null); // 'add' | 'import' | 'recurring' | null
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteError, setDeleteError] = useState(false);
  const [addingRecurringId, setAddingRecurringId] = useState(null);
  // A background save that failed: { transaction?, values, message }. The toast offers to
  // reopen the form (`retrying`) with what was typed.
  const [saveFailure, setSaveFailure] = useState(null);
  const [retrying, setRetrying] = useState(null);

  const { data: loaded = [], isLoading, isError, refetch } = useMonthTransactions(month, year);

  // Last month, for the comparison in the summary (cached like any other month)
  const previous = new Date(year, month - 2, 1);
  const previousMonth = previous.getMonth() + 1;
  const previousYear = previous.getFullYear();
  const { data: previousLoaded, isSuccess: previousReady } = useMonthTransactions(previousMonth, previousYear);

  // Once this month and the last are in, quietly load the next ones you'd step to, so the
  // month arrows rarely show a skeleton. Waiting first keeps them from slowing the screen you're on.
  const prefetchMonth = usePrefetchMonth();
  const monthReady = !isLoading && !isError;
  useEffect(() => {
    if (!monthReady || !previousReady) return;
    const twoBack = new Date(year, month - 3, 1);
    prefetchMonth(twoBack.getMonth() + 1, twoBack.getFullYear());
    const next = new Date(year, month, 1);
    if (next <= new Date()) prefetchMonth(next.getMonth() + 1, next.getFullYear());
  }, [monthReady, previousReady, month, year, prefetchMonth]);
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const invalidateTransactions = useInvalidateTransactions();
  const recurring = useRecurring(year, month);
  const latest = useLatestTransactions();

  // Ids whose delete request is in flight; they stay hidden until the cache drops them
  const [sendingIds, setSendingIds] = useState([]);

  const showDeleteError = () => {
    setDeleteError(true);
    setTimeout(() => setDeleteError(false), 3000);
  };

  // useUndoableDelete always calls the latest version of this
  const commitDelete = (transaction, { keepalive } = {}) => {
    // The page is closing: fire and forget, nothing is left to update
    if (keepalive) {
      deleteTransaction(transaction.id, { keepalive: true }).catch(() => {});
      return;
    }
    setSendingIds(ids => [...ids, transaction.id]);
    // mutateAsync, not mutate: mutate's per-call callbacks only fire for the latest call,
    // and quick successive deletes can overlap
    deleteMutation.mutateAsync(transaction.id)
      .catch(err => { console.error('Delete failed', err); showDeleteError(); })
      .finally(() => setSendingIds(ids => ids.filter(id => id !== transaction.id)));
  };

  const undoableDelete = useUndoableDelete(commitDelete);

  const transactions = useMemo(() => {
    const hidden = new Set(sendingIds);
    if (undoableDelete.pending) hidden.add(undoableDelete.pending.id);
    return hidden.size ? loaded.filter(t => !hidden.has(t.id)) : loaded;
  }, [loaded, sendingIds, undoableDelete.pending]);

  const rows = useMemo(
    () => applyFilters(transactions, { category, paymentMethod, search, sortBy, sortDirection }),
    [transactions, category, paymentMethod, search, sortBy, sortDirection]
  );
  const shownTotal = rows.reduce((sum, r) => sum + r.amount, 0);
  const monthTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
  const filtersActive = category !== 'All' || paymentMethod !== 'All' || search.trim() !== '';

  // While a month is still running, compare with the same days of last month, not all of it
  const now = new Date();
  const partialMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const previousTotal = previousReady
    ? previousLoaded
        .filter(t => !partialMonth || (t.date && Number(t.date.slice(8, 10)) <= now.getDate()))
        .reduce((sum, t) => sum + t.amount, 0)
    : null;

  const breakdown = totalByCategory(transactions);

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

  const clearFilters = () => { setCategory('All'); setPaymentMethod('All'); setSearch(''); };

  // Closing search also clears it, so a hidden search never filters the list
  const toggleSearch = () => {
    if (searchOpen) setSearch('');
    setSearchOpen(open => !open);
  };

  // Send a waiting delete before the session token is cleared
  const handleLogout = () => {
    undoableDelete.flush();
    logout();
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

  // Forms close right away; if the save then fails, the toast lets you reopen it
  const saveFailed = (failure) => (err) => {
    console.error('Save failed', err);
    setSaveFailure({
      ...failure,
      // fetch rejects with a TypeError when the request never reaches the server
      message: err instanceof TypeError
        ? 'Couldn\'t reach the server. Check your connection and try again.'
        : err.message || 'Couldn\'t save this. Try again.',
    });
  };

  const saveNew = (values) => createMutation.mutateAsync(values).catch(saveFailed({ values }));

  const saveChanges = (transaction, values) =>
    updateMutation.mutateAsync({ id: transaction.id, changes: values }).catch(saveFailed({ transaction, values }));

  const retrySave = () => {
    setRetrying(saveFailure);
    setSaveFailure(null);
  };

  // The failure toast hides after a while; the expense itself is already back as it was
  useEffect(() => {
    if (!saveFailure) return;
    const timer = setTimeout(() => setSaveFailure(null), 8000);
    return () => clearTimeout(timer);
  }, [saveFailure]);

  return (
    <>
      <div className={page.root}>
        <div className={page.app}>
          <AppHeader
            userName={currentUser?.userName}
            searchOpen={searchOpen}
            onToggleSearch={toggleSearch}
            onImport={() => setModal('import')}
            onLogout={handleLogout}
          />

          {searchOpen && <SearchBox value={search} onChange={setSearch} autoFocus />}

          <MonthSummary
            isLoading={isLoading}
            monthNav={<MonthNav month={month} year={year} onChange={handleMonthChange} />}
            monthName={MONTH_NAMES[month - 1]}
            total={monthTotal}
            count={transactions.length}
            previousTotal={previousTotal}
            previousMonthName={MONTH_NAMES[previousMonth - 1]}
            partialMonth={partialMonth}
            filtersActive={filtersActive}
            shownTotal={shownTotal}
            shownCount={rows.length}
          />

          {!isLoading && (
            <SpendingBreakdown
              breakdown={breakdown}
              total={monthTotal}
              selectedCategory={category}
              onSelectCategory={setCategory}
            />
          )}

          {transactions.length > 0 && (
            <Filters
              categories={uniqueValues(transactions, 'category')}
              paymentMethods={uniqueValues(transactions, 'paymentMethod')}
              category={category}
              paymentMethod={paymentMethod}
              onCategoryChange={setCategory}
              onPaymentMethodChange={setPaymentMethod}
            />
          )}

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
            onDelete={undoableDelete.remove}
            onEdit={setEditingTransaction}
            isRecurring={recurring.isRecurring}
            onToggleRecurring={recurring.toggle}
          />
        </div>
      </div>

      <Fab label="Add expense" onClick={() => setModal('add')} />

      {modal === 'add' && (
        <TransactionForm
          recent={recentExpenses(latest)}
          onSubmit={saveNew}
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
          onSubmit={values => saveChanges(editingTransaction, values)}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {retrying && (
        <TransactionForm
          transaction={retrying.transaction}
          draft={retrying.values}
          initialError={retrying.message}
          onSubmit={values => retrying.transaction ? saveChanges(retrying.transaction, values) : saveNew(values)}
          onClose={() => setRetrying(null)}
        />
      )}

      {undoableDelete.pending && (
        <UndoToast
          key={undoableDelete.pending.id}
          message={`Deleted "${undoableDelete.pending.expense}"`}
          onUndo={undoableDelete.undo}
        />
      )}

      {saveFailure && (
        // Sits above the undo toast when both are showing
        <div className={cx(styles.toast, undoableDelete.pending && styles.toastRaised)} role="alert">
          <span className={styles.toastMessage}>
            <span aria-hidden="true">⚠️</span> Couldn't save "{saveFailure.values.expense}"
          </span>
          <button className={styles.undoBtn} onClick={retrySave}>Try again</button>
        </div>
      )}

      {deleteError && !undoableDelete.pending && !saveFailure && (
        <div className={styles.toast} role="alert">
          <span aria-hidden="true">⚠️</span> Couldn't delete. It's back in the list.
        </div>
      )}
    </>
  );
};

export default TransactionsPage;
