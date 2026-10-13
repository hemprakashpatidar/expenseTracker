import { useEffect, useRef, useState } from 'react';
import { getCategoryIcon, getCategoryLabel } from '../../shared/categoryStyle.js';
import { formatAmount } from '../../shared/formatters.js';
import { matchCategory } from '../../shared/guessCategory.js';
import { getLastPaymentMethod, saveLastPaymentMethod } from './addDefaults.js';
import { CATEGORIES, PAYMENT_METHODS } from '../../shared/constants.js';
import { todayISO, toISODate, formatShortDate } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import styles from './TransactionForm.module.css';

const CUSTOM = 'Other (custom)';
// A value outside the known list is shown as the custom option with the text filled in
const splitKnown = (value, known) => known.includes(value)
  ? { selected: value, custom: '' }
  : { selected: CUSTOM, custom: value || '' };

const yesterdayISO = () => {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
};

const initialValues = (transaction) => {
  if (!transaction) {
    // New expenses start with the payment method used last time, and no category:
    // it's picked by hand or follows the description
    const payment = splitKnown(getLastPaymentMethod() || 'UPI', PAYMENT_METHODS);
    return {
      expense: '', amount: '', date: todayISO(),
      category: '', customCategory: '',
      paymentMethod: payment.selected, customPayment: payment.custom,
    };
  }
  const category = splitKnown(transaction.category, CATEGORIES);
  const payment = splitKnown(transaction.paymentMethod, PAYMENT_METHODS);
  return {
    expense: transaction.expense || '',
    amount: String(transaction.amount || ''),
    date: transaction.date || todayISO(),
    category: category.selected, customCategory: category.custom,
    paymentMethod: payment.selected, customPayment: payment.custom,
  };
};

const resolve = (selected, custom) => selected === CUSTOM ? (custom.trim() || 'Other') : selected;

const TEXT = {
  add: { title: <><span aria-hidden="true">💸</span> New expense</>, submit: <>Save expense</>, busy: 'Saving…', failed: 'Couldn\'t add the expense. Try again.' },
  edit: { title: <span className={styles.titlePill}><span aria-hidden="true">✏️</span> Edit expense</span>, submit: <><span aria-hidden="true">💾</span> Save changes</>, busy: 'Saving…', failed: 'Couldn\'t save your changes. Try again.' },
};

// Add and edit share one form; `transaction` switches it to edit mode.
// onSubmit receives { expense, amount, date, category, paymentMethod } and should throw on failure.
// `recent` (add mode) are past expenses offered as one-tap shortcuts.
const TransactionForm = ({ transaction, recent = [], onSubmit, onClose }) => {
  const mode = transaction ? 'edit' : 'add';
  const text = TEXT[mode];
  const [initial] = useState(() => initialValues(transaction));
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // While adding, the category follows the description until you pick one yourself
  const [categoryPicked, setCategoryPicked] = useState(mode === 'edit');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleDescriptionChange = (value) => {
    setForm(prev => categoryPicked
      ? { ...prev, expense: value }
      : { ...prev, expense: value, category: matchCategory(value) || '', customCategory: '' });
  };

  // Fill everything from a past expense; the date stays as chosen (Today by default)
  const applyRecent = (t) => {
    const category = splitKnown(t.category, CATEGORIES);
    const payment = splitKnown(t.paymentMethod, PAYMENT_METHODS);
    setForm(prev => ({
      ...prev,
      expense: t.expense,
      amount: String(t.amount),
      category: category.selected, customCategory: category.custom,
      paymentMethod: payment.selected, customPayment: payment.custom,
    }));
    setCategoryPicked(true);
    setError('');
  };
  const changed = (field) => mode === 'edit' && form[field] !== initial[field];

  const handleAmountChange = (e) => {
    if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) set('amount', e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(form.amount);
    if (!form.amount.trim() || isNaN(amount) || amount <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    if (!form.expense.trim()) {
      setError('Add a short description.');
      return;
    }
    if (!form.category) {
      setError('Pick a category.');
      return;
    }

    const paymentMethod = resolve(form.paymentMethod, form.customPayment);
    setLoading(true);
    try {
      await onSubmit({
        expense: form.expense.trim(),
        amount,
        date: form.date,
        category: resolve(form.category, form.customCategory),
        paymentMethod,
      });
      if (mode === 'add') saveLastPaymentMethod(paymentMethod);
      onClose();
    } catch (err) {
      // fetch rejects with a TypeError when the request never reaches the server
      setError(err instanceof TypeError
        ? 'Couldn\'t reach the server. Check your connection and try again.'
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
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit} noValidate>
          {error && <div className={styles.error} role="alert"><span aria-hidden="true">⚠️</span> {error}</div>}

          {mode === 'add' && recent.length > 0 && (
            <div className={styles.recent}>
              <span className={styles.label} id="tf-recent">Recent</span>
              <div className={styles.recentRow} role="group" aria-labelledby="tf-recent">
                {recent.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={styles.recentChip}
                    onClick={() => applyRecent(t)}
                    disabled={loading}
                    aria-label={`Fill in ${t.expense}, ₹${formatAmount(t.amount)}, ${t.category}, ${t.paymentMethod}`}
                  >
                    <span aria-hidden="true">{getCategoryIcon(t.category)}</span>
                    <span className={styles.recentName}>{t.expense}</span>
                    <span className={styles.recentAmount}>₹{formatAmount(t.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount comes first and largest: it's what you know when you open the form */}
          <div className={styles.amountHero}>
            <label className={styles.label} htmlFor="tf-amount">Amount</label>
            <div className={cx(styles.amountWrap, changed('amount') && styles.changed)}>
              <span className={styles.currency} aria-hidden="true">₹</span>
              <input
                id="tf-amount"
                className={styles.amountInput}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={form.amount}
                onChange={handleAmountChange}
                placeholder="0"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="tf-expense">Description</label>
            <input
              id="tf-expense"
              className={cx(styles.input, changed('expense') && styles.changed)}
              type="text"
              value={form.expense}
              onChange={e => handleDescriptionChange(e.target.value)}
              placeholder="Swiggy dinner"
              disabled={loading}
            />
          </div>

          <ChoiceGroup
            label="Category"
            customLabel="custom category"
            options={CATEGORIES}
            renderOption={cat => <><span aria-hidden="true">{getCategoryIcon(cat)}</span> {getCategoryLabel(cat)}</>}
            optionTitle={cat => cat}
            customOption={<><span aria-hidden="true">✏️</span> Custom</>}
            value={form.category}
            customValue={form.customCategory}
            customPlaceholder="Gym membership"
            disabled={loading}
            onChange={value => {
              setCategoryPicked(true);
              setForm(prev => ({ ...prev, category: value, customCategory: value === CUSTOM ? prev.customCategory : '' }));
            }}
            onCustomChange={value => set('customCategory', value)}
          />

          <ChoiceGroup
            label="Paid with"
            customLabel="custom payment method"
            options={PAYMENT_METHODS}
            renderOption={pm => pm}
            customOption={<><span aria-hidden="true">✏️</span> Custom</>}
            value={form.paymentMethod}
            customValue={form.customPayment}
            customPlaceholder="Amazon Pay"
            disabled={loading}
            onChange={value => setForm(prev => ({ ...prev, paymentMethod: value, customPayment: value === CUSTOM ? prev.customPayment : '' }))}
            onCustomChange={value => set('customPayment', value)}
          />

          <DateChoice value={form.date} disabled={loading} onChange={value => set('date', value)} />

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

// One scrollable line of toggle chips plus a "custom" option that reveals a text field.
// The selected chip is kept in view, including when the value changes from outside
// (auto category, a Recent shortcut).
const ChoiceGroup = ({
  label, customLabel, options, renderOption, optionTitle, customOption,
  value, customValue, customPlaceholder, disabled, onChange, onCustomChange,
}) => {
  const rowRef = useRef(null);

  useEffect(() => {
    const row = rowRef.current;
    const selected = row?.querySelector('[aria-pressed="true"]');
    if (!row || !selected) return;
    // Scroll only the row, never the sheet
    const target = selected.offsetLeft - (row.clientWidth - selected.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [value]);

  const choice = (key, content, title, ariaLabel) => (
    <button
      key={key}
      type="button"
      className={cx(styles.chip, value === key && styles.selected)}
      aria-pressed={value === key}
      aria-label={ariaLabel}
      title={title}
      onClick={() => onChange(key)}
      disabled={disabled}
    >
      {content}
    </button>
  );

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>{label}</legend>
      <div className={styles.chipRow} ref={rowRef}>
        {options.map(option => choice(option, renderOption(option), optionTitle?.(option)))}
        {choice(CUSTOM, customOption, undefined, customLabel[0].toUpperCase() + customLabel.slice(1))}
      </div>
      {value === CUSTOM && (
        <input
          className={cx(styles.input, styles.customInput)}
          type="text"
          aria-label={`Enter ${customLabel}`}
          value={customValue}
          onChange={e => onCustomChange(e.target.value)}
          placeholder={customPlaceholder}
          disabled={disabled}
          autoFocus
        />
      )}
    </fieldset>
  );
};

// Today / Yesterday cover most entries; "Pick date" lays a transparent native date input
// over the chip, so a tap opens the platform's own picker
const DateChoice = ({ value, disabled, onChange }) => {
  const today = todayISO();
  const yesterday = yesterdayISO();
  const isOther = value !== today && value !== yesterday;

  const openPicker = (e) => {
    // Desktop Chrome only opens the calendar from its icon unless asked
    try { e.currentTarget.showPicker?.(); } catch { /* the input still works as typed */ }
  };

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>Date</legend>
      <div className={styles.chips}>
        <button type="button" className={cx(styles.chip, value === today && styles.selected)} aria-pressed={value === today} onClick={() => onChange(today)} disabled={disabled}>
          Today
        </button>
        <button type="button" className={cx(styles.chip, value === yesterday && styles.selected)} aria-pressed={value === yesterday} onClick={() => onChange(yesterday)} disabled={disabled}>
          Yesterday
        </button>
        <span className={cx(styles.chip, styles.pickChip, isOther && styles.selected)}>
          <span aria-hidden="true">📅</span> {isOther ? formatShortDate(value) : 'Pick date'}
          <input
            className={styles.pickInput}
            type="date"
            aria-label="Pick a date"
            value={value}
            onClick={openPicker}
            onChange={e => e.target.value && onChange(e.target.value)}
            disabled={disabled}
          />
        </span>
      </div>
    </fieldset>
  );
};

export default TransactionForm;
