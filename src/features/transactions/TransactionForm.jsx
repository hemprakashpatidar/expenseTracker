import { useState } from 'react';
import { getCategoryIcon } from '../../shared/categoryStyle.js';
import { CATEGORIES, PAYMENT_METHODS } from '../../shared/constants.js';
import styles from './TransactionForm.module.css';

const CUSTOM = 'Other (custom)';
const today = () => new Date().toISOString().split('T')[0];

// Convert display date (DD-MM-YY or DD-MM-YYYY) back to YYYY-MM-DD for <input type="date">
const toInputDate = (dateStr) => {
  if (!dateStr) return today();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [dd, mm, yy] = parts;
    const year = yy.length === 2 ? `20${yy}` : yy;
    return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return today();
};

// A value outside the known list is shown as "Other (custom)" with the text filled in
const splitKnown = (value, known) => known.includes(value)
  ? { selected: value, custom: '' }
  : { selected: CUSTOM, custom: value || '' };

const initialValues = (transaction) => {
  if (!transaction) {
    return {
      expense: '', amount: '', date: today(),
      category: 'Other', customCategory: '',
      paymentMethod: 'UPI', customPayment: '',
    };
  }
  const category = splitKnown(transaction.category, CATEGORIES);
  const payment = splitKnown(transaction.paymentMethod, PAYMENT_METHODS);
  return {
    expense: transaction.expense || '',
    amount: String(transaction.amount || ''),
    date: toInputDate(transaction.date),
    category: category.selected, customCategory: category.custom,
    paymentMethod: payment.selected, customPayment: payment.custom,
  };
};

const resolve = (selected, custom) => selected === CUSTOM ? (custom.trim() || 'Other') : selected;

const cx = (...classes) => classes.filter(Boolean).join(' ');

const TEXT = {
  add: { title: <><span>💸</span> Add Transaction</>, submit: <>＋ Add Transaction</>, busy: 'Adding...', failed: 'Failed to add transaction. Please try again.' },
  edit: { title: <span className={styles.titlePill}>✏️ Edit Transaction</span>, submit: <>💾 Save Changes</>, busy: 'Saving…', failed: 'Failed to update transaction. Please try again.' },
};

// Add and edit share one form; `transaction` switches it to edit mode.
// onSubmit receives { expense, amount, date, category, paymentMethod } and should throw on failure.
const TransactionForm = ({ transaction, onSubmit, onClose }) => {
  const mode = transaction ? 'edit' : 'add';
  const text = TEXT[mode];
  const [initial] = useState(() => initialValues(transaction));
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const changed = (field) => mode === 'edit' && form[field] !== initial[field];

  const handleAmountChange = (e) => {
    if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) set('amount', e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.expense.trim() || !form.amount.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        expense: form.expense.trim(),
        amount,
        date: form.date,
        category: resolve(form.category, form.customCategory),
        paymentMethod: resolve(form.paymentMethod, form.customPayment),
      });
      onClose();
    } catch (err) {
      // fetch rejects with a TypeError when the request never reaches the server
      setError(err instanceof TypeError
        ? 'Network error. Please check your connection and try again.'
        : err.message || text.failed);
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={cx(styles.modal, mode === 'edit' && styles.edit)} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <div className={styles.headerTitle}>{text.title}</div>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>⚠️ {error}</div>}

          {/* Description */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tf-expense">Description</label>
            <input
              id="tf-expense"
              className={cx(styles.input, changed('expense') && styles.changed)}
              type="text"
              value={form.expense}
              onChange={e => set('expense', e.target.value)}
              placeholder="What did you spend on?"
              required
              disabled={loading}
            />
          </div>

          {/* Amount + Date */}
          <div className={styles.amountRow}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.label} htmlFor="tf-amount">Amount</label>
              <div className={styles.amountWrap}>
                <span className={styles.currency}>₹</span>
                <input
                  id="tf-amount"
                  className={cx(styles.amountInput, changed('amount') && styles.changed)}
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  required
                  disabled={loading}
                  autoFocus={mode === 'edit'}
                />
              </div>
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.label} htmlFor="tf-date">Date</label>
              <input
                id="tf-date"
                className={cx(styles.input, styles.dateInput)}
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <SelectWithCustom
            id="tf-category"
            label="Category"
            icon={getCategoryIcon(form.category === CUSTOM ? 'Other' : form.category)}
            options={CATEGORIES}
            renderOption={cat => `${getCategoryIcon(cat)} ${cat}`}
            value={form.category}
            customValue={form.customCategory}
            customPlaceholder="Enter custom category…"
            isChanged={changed('category')}
            disabled={loading}
            autoFocusCustom={mode === 'add'}
            onChange={value => setForm(prev => ({ ...prev, category: value, customCategory: value === CUSTOM ? prev.customCategory : '' }))}
            onCustomChange={value => set('customCategory', value)}
          />

          <SelectWithCustom
            id="tf-payment"
            label="Payment Method"
            icon="💳"
            options={PAYMENT_METHODS}
            renderOption={pm => pm}
            value={form.paymentMethod}
            customValue={form.customPayment}
            customPlaceholder="Enter payment method…"
            isChanged={changed('paymentMethod')}
            disabled={loading}
            autoFocusCustom={mode === 'add'}
            onChange={value => setForm(prev => ({ ...prev, paymentMethod: value, customPayment: value === CUSTOM ? prev.customPayment : '' }))}
            onCustomChange={value => set('customPayment', value)}
          />

          {/* Actions */}
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? <><span className={styles.spinner} /> {text.busy}</> : text.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SelectWithCustom = ({
  id, label, icon, options, renderOption, value, customValue, customPlaceholder,
  isChanged, disabled, autoFocusCustom, onChange, onCustomChange,
}) => (
  <div className={styles.field}>
    <label className={styles.label} htmlFor={id}>{label}</label>
    <div className={styles.selectWrap}>
      <span className={styles.selectIcon}>{icon}</span>
      <select
        id={id}
        className={cx(styles.styledSelect, isChanged && styles.changed)}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map(option => (
          <option key={option} value={option}>{renderOption(option)}</option>
        ))}
        <option value={CUSTOM}>✏️ Other (custom)…</option>
      </select>
      <span className={styles.selectChevron}>▾</span>
    </div>
    {value === CUSTOM && (
      <input
        className={cx(styles.input, styles.customInput)}
        type="text"
        aria-label={`Custom ${label.toLowerCase()}`}
        value={customValue}
        onChange={e => onCustomChange(e.target.value)}
        placeholder={customPlaceholder}
        disabled={disabled}
        autoFocus={autoFocusCustom}
      />
    )}
  </div>
);

export default TransactionForm;
