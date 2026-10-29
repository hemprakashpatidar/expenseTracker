import { useState } from 'react';
import { getCategoryLabel } from '../../shared/categoryStyle.js';
import { formatAmount } from '../../shared/formatters.js';
import { matchCategory } from '../../shared/guessCategory.js';
import { getLastPaymentMethod, saveLastPaymentMethod } from './addDefaults.js';
import { CATEGORIES, PAYMENT_METHODS } from '../../shared/constants.js';
import { todayISO } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import Icon from '../../shared/Icon.jsx';
import CategoryIcon from '../../shared/CategoryIcon.jsx';
import ChoiceGroup from '../../shared/form/ChoiceGroup.jsx';
import DateChoice from '../../shared/form/DateChoice.jsx';
import { CUSTOM } from '../../shared/form/customChoice.js';
import { useLockPageScroll } from '../../shared/form/useLockPageScroll.js';
import styles from '../../shared/form/SheetForm.module.css';

// A value outside the known list is shown as the custom option with the text filled in
const splitKnown = (value, known) => known.includes(value)
  ? { selected: value, custom: '' }
  : { selected: CUSTOM, custom: value || '' };

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
  add: { title: 'New expense' },
  edit: { title: <span className={styles.titlePill}><Icon name="pencil" size={14} /> Edit expense</span> },
};

// Inline message under the field it's about
const FieldError = ({ error, field }) => error.field === field && (
  <div className={styles.fieldError} role="alert"><Icon name="alert" size={14} /> {error.message}</div>
);

// Add and edit share one form; `transaction` switches it to edit mode.
// onSubmit receives { expense, amount, date, category, paymentMethod }; the form closes straight
// away and the page saves in the background.
// `draft` and `initialError` reopen the form after a failed save, with what was typed and why it failed.
// `recent` (add mode) are past expenses offered as one-tap shortcuts.
// Edit mode also offers "Repeat every month" (`isRecurring`, applied on save through
// onRecurringChange(updatedTransaction)) and Delete (`onDelete`).
const TransactionForm = ({
  transaction, draft, initialError = '', recent = [], isRecurring = false,
  onSubmit, onRecurringChange, onDelete, onClose,
}) => {
  useLockPageScroll();
  const mode = transaction ? 'edit' : 'add';
  const text = TEXT[mode];
  // Edit mode highlights fields that differ from the saved expense, so that stays the baseline
  const [initial] = useState(() => initialValues(transaction));
  const [form, setForm] = useState(() => draft ? initialValues(draft) : initial);
  // { field, message }; a message with no field (a failed save) shows at the top
  const [error, setError] = useState({ field: null, message: initialError });
  const [repeat, setRepeat] = useState(isRecurring);
  // While adding, the category follows the description until you pick one yourself
  const [categoryPicked, setCategoryPicked] = useState(mode === 'edit' || Boolean(draft));

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
    setError({ field: null, message: '' });
  };
  const changed = (field) => mode === 'edit' && form[field] !== initial[field];

  const handleAmountChange = (e) => {
    if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) set('amount', e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError({ field: null, message: '' });

    const amount = parseFloat(form.amount);
    if (!form.amount.trim() || isNaN(amount) || amount <= 0) {
      setError({ field: 'amount', message: 'Enter an amount greater than 0.' });
      return;
    }
    if (!form.expense.trim()) {
      setError({ field: 'expense', message: 'Add a short description.' });
      return;
    }
    if (!form.category) {
      setError({ field: 'category', message: 'Pick a category.' });
      return;
    }

    const paymentMethod = resolve(form.paymentMethod, form.customPayment);
    const values = {
      expense: form.expense.trim(),
      amount,
      date: form.date,
      category: resolve(form.category, form.customCategory),
      paymentMethod,
    };
    onSubmit(values);
    if (mode === 'add') saveLastPaymentMethod(paymentMethod);
    if (mode === 'edit' && repeat !== isRecurring) onRecurringChange?.({ ...transaction, ...values });
    onClose();
  };

  const validAmount = parseFloat(form.amount) > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={cx(styles.modal, mode === 'edit' && styles.edit)} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.headerTitle}>{text.title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close"><Icon name="x" size={22} /></button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit} noValidate>
          {error.message && !error.field && (
            <div className={styles.error} role="alert"><Icon name="alert" size={16} /> {error.message}</div>
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
                aria-invalid={error.field === 'amount' || undefined}
                autoFocus
              />
            </div>
            <FieldError error={error} field="amount" />

            {mode === 'add' && recent.length > 0 && (
              <div className={styles.recentRow} role="group" aria-label="Recent expenses">
                <Icon name="history" size={16} className={styles.recentIcon} />
                {recent.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={styles.recentChip}
                    onClick={() => applyRecent(t)}
                    aria-label={`Fill in ${t.expense}, ₹${formatAmount(t.amount)}, ${t.category}, ${t.paymentMethod}`}
                  >
                    <CategoryIcon category={t.category} size={14} />
                    <span className={styles.recentName}>{t.expense}</span>
                    <span className={styles.recentAmount}>₹{formatAmount(t.amount)}</span>
                  </button>
                ))}
              </div>
            )}
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
              aria-invalid={error.field === 'expense' || undefined}
            />
            <FieldError error={error} field="expense" />
          </div>

          <div className={styles.field}>
            <ChoiceGroup
              label="Category"
              customLabel="custom category"
              options={CATEGORIES}
              renderOption={cat => <><CategoryIcon category={cat} /> {getCategoryLabel(cat)}</>}
              optionTitle={cat => cat}
              customOption={<><Icon name="pencil" size={14} /> Custom</>}
              value={form.category}
              customValue={form.customCategory}
              customPlaceholder="Gym membership"
              onChange={value => {
                setCategoryPicked(true);
                setForm(prev => ({ ...prev, category: value, customCategory: value === CUSTOM ? prev.customCategory : '' }));
              }}
              onCustomChange={value => set('customCategory', value)}
            />
            <FieldError error={error} field="category" />
          </div>

          <ChoiceGroup
            label="Paid with"
            customLabel="custom payment method"
            options={PAYMENT_METHODS}
            renderOption={pm => pm}
            customOption={<><Icon name="pencil" size={14} /> Custom</>}
            value={form.paymentMethod}
            customValue={form.customPayment}
            customPlaceholder="Amazon Pay"
            onChange={value => setForm(prev => ({ ...prev, paymentMethod: value, customPayment: value === CUSTOM ? prev.customPayment : '' }))}
            onCustomChange={value => set('customPayment', value)}
          />

          <DateChoice value={form.date} onChange={value => set('date', value)} />

          {mode === 'edit' && onRecurringChange && (
            <label className={styles.switchRow}>
              <Icon name="repeat" size={18} />
              <span className={styles.switchLabel}>Repeat every month</span>
              <input
                type="checkbox"
                role="switch"
                className={styles.switch}
                checked={repeat}
                onChange={e => setRepeat(e.target.checked)}
              />
            </label>
          )}

          {/* Pinned to the bottom of the sheet, so Save is always in reach */}
          <div className={styles.actions}>
            {mode === 'edit' && onDelete && (
              <button type="button" className={styles.deleteAction} onClick={() => { onDelete(); onClose(); }}>
                <Icon name="trash" size={18} /> Delete
              </button>
            )}
            <button type="submit" className={styles.submit}>
              {mode === 'edit'
                ? 'Save changes'
                : validAmount ? <>Save <span className={styles.submitAmount}>₹{formatAmount(parseFloat(form.amount))}</span></> : 'Save expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
