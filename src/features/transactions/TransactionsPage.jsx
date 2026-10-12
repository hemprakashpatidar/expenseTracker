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
import styles from './TransactionsPage.module.css';

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

      <div className={styles.root}>
        <div className={styles.app}>
          <AppHeader userName={currentUser?.userName} onLogout={logout} />

          <div className={styles.controls}>
            {/* Month + Import/Add */}
            <div className={styles.row}>
              <MonthPicker month={month} year={year} onChange={handleMonthChange} />
              <div className={styles.buttons}>
                <button className={styles.importBtn} onClick={() => setModal('import')}>
                  📥 Import
                </button>
                <button className={styles.addBtn} onClick={() => setModal('add')}>
                  ＋ Add
                </button>
              </div>
            </div>

            {/* Search + Total */}
            <div className={styles.row}>
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
        <div className={styles.toast}>
          ⚠️ Couldn't delete — please try again
        </div>
      )}
    </>
  );
};

export default TransactionsPage;
