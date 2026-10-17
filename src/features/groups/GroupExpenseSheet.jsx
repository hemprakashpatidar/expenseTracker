import { useState } from 'react';
import { CATEGORIES, PAYMENT_METHODS } from '../../shared/constants.js';
import { getCategoryIcon, getCategoryLabel } from '../../shared/categoryStyle.js';
import { matchCategory } from '../../shared/guessCategory.js';
import { formatAmount } from '../../shared/formatters.js';
import { todayISO } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import ChoiceGroup from '../../shared/form/ChoiceGroup.jsx';
import DateChoice from '../../shared/form/DateChoice.jsx';
import { CUSTOM } from '../../shared/form/customChoice.js';
import { getLastPaymentMethod, saveLastPaymentMethod } from '../transactions/addDefaults.js';
import { useAddGroupExpense } from './queries.js';
import { previewGroupSplit } from './splitPreview.js';
import sheet from '../../shared/form/SheetForm.module.css';
import ledgerStyles from '../ledger/Ledger.module.css';
import styles from './Groups.module.css';

const SPLIT_TYPES = [
  { value: 'equal', label: 'Equally' },
  { value: 'exact', label: 'Exact ₹' },
  { value: 'percent', label: 'By %' },
  { value: 'shares', label: 'Shares' },
];
const UNIT = { exact: '₹', percent: '%', shares: '×' };

const resolve = (selected, custom) => (selected === CUSTOM ? custom.trim() : selected);
const decimalInput = (value) => value === '' || /^\d*\.?\d{0,2}$/.test(value);

// Percentages that add up to exactly 100, the last person taking the rounding
const evenPercents = (ids) => {
  const each = Math.floor(10_000 / ids.length);
  return Object.fromEntries(ids.map((id, i) => [id, String((i === ids.length - 1 ? 10_000 - each * (ids.length - 1) : each) / 100)]));
};

const GroupExpenseSheet = ({ group, members, onClose, onSaved }) => {
  const addExpense = useAddGroupExpense();
  const self = members.find(m => m.isSelf);
  const lastPayment = getLastPaymentMethod() || 'UPI';

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidById, setPaidById] = useState(self?.id ?? members[0]?.id);
  const [splitType, setSplitType] = useState('equal');
  // Equal: who's included. Other types: the typed value per person ('' or 0 means not in it)
  const [included, setIncluded] = useState(() => new Set(members.map(m => m.id)));
  const [values, setValues] = useState({ exact: {}, percent: {}, shares: Object.fromEntries(members.map(m => [m.id, '1'])) });
  const [date, setDate] = useState(todayISO());
  const [addMyShare, setAddMyShare] = useState(false);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [categoryPicked, setCategoryPicked] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.includes(lastPayment) ? lastPayment : CUSTOM);
  const [customPayment, setCustomPayment] = useState(PAYMENT_METHODS.includes(lastPayment) ? '' : lastPayment);
  const [error, setError] = useState('');

  const participants = splitType === 'equal'
    ? members.filter(m => included.has(m.id)).map(m => ({ personId: m.id }))
    : members
        .map(m => ({ personId: m.id, value: values[splitType][m.id] ?? '' }))
        .filter(p => Number(p.value) > 0);
  const preview = previewGroupSplit({ amount, type: splitType, participants, payerId: paidById });
  const mySharePaise = preview.shares?.get(self?.id) ?? 0;

  const setValue = (personId, value) => {
    if (!decimalInput(value)) return;
    setValues(prev => ({ ...prev, [splitType]: { ...prev[splitType], [personId]: value } }));
  };

  const toggleIncluded = (id) => setIncluded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleDescriptionChange = (value) => {
    setDescription(value);
    if (!categoryPicked) setCategory(matchCategory(value) || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = parseFloat(amount);
    if (!amount || isNaN(total) || total <= 0) { setError('Enter an amount greater than 0.'); return; }
    if (!description.trim()) { setError('Add what it was for.'); return; }
    if (!preview.ready) { setError(preview.status); return; }
    const paymentValue = resolve(paymentMethod, customPayment);
    const categoryValue = resolve(category, customCategory);
    if (addMyShare && mySharePaise === 0) { setError('You\'re not in this split, so there\'s no share to add.'); return; }
    if (addMyShare && !categoryValue) { setError('Pick a category for your share.'); return; }
    if (addMyShare && !paymentValue) { setError('Pick how you paid for your share.'); return; }
    setError('');

    try {
      const result = await addExpense.mutateAsync({
        groupId: group.id,
        expense: {
          description: description.trim(),
          amount: total,
          date,
          paidById,
          split: {
            type: splitType,
            participants: participants.map(p => (splitType === 'equal' ? { personId: p.personId } : { personId: p.personId, value: Number(p.value) })),
          },
          category: categoryValue || undefined,
          addMyShare,
          ...(addMyShare ? { paymentMethod: paymentValue } : {}),
        },
      });
      if (addMyShare) saveLastPaymentMethod(paymentValue);
      onSaved?.({ shareNotAdded: addMyShare && !result.myShareAdded });
      onClose();
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Couldn\'t reach the server. Check your connection and try again.'
        : err.message || 'Couldn\'t save this. Try again.');
    }
  };

  const saving = addExpense.isPending;

  return (
    <div className={sheet.overlay} onClick={onClose}>
      <div className={sheet.modal} onClick={e => e.stopPropagation()}>
        <div className={sheet.handle} />
        <div className={sheet.header}>
          <div className={sheet.headerTitle}><span aria-hidden="true">{group.emoji || '👥'}</span> Add to {group.name}</div>
          <button type="button" className={sheet.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className={sheet.body} onSubmit={handleSubmit} noValidate>
          {error && <div className={sheet.error} role="alert"><span aria-hidden="true">⚠️</span> {error}</div>}

          <div className={sheet.amountHero}>
            <label className={sheet.label} htmlFor="ge-amount">Amount</label>
            <div className={sheet.amountWrap}>
              <span className={sheet.currency} aria-hidden="true">₹</span>
              <input
                id="ge-amount"
                className={sheet.amountInput}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={e => { if (decimalInput(e.target.value)) setAmount(e.target.value); }}
                placeholder="0"
                disabled={saving}
                autoFocus
              />
            </div>
          </div>

          <div className={sheet.field}>
            <label className={sheet.label} htmlFor="ge-description">What was it for?</label>
            <input
              id="ge-description"
              className={sheet.input}
              value={description}
              onChange={e => handleDescriptionChange(e.target.value)}
              placeholder="Beach shack dinner"
              disabled={saving}
            />
          </div>

          <ChoiceGroup
            label="Paid by"
            options={members.map(m => m.id)}
            renderOption={id => members.find(m => m.id === id)?.name}
            value={paidById}
            disabled={saving}
            onChange={setPaidById}
          />

          <ChoiceGroup
            label="Split"
            options={SPLIT_TYPES.map(t => t.value)}
            renderOption={value => SPLIT_TYPES.find(t => t.value === value).label}
            value={splitType}
            disabled={saving}
            onChange={setSplitType}
          />

          <div className={styles.splitBox}>
            {splitType === 'percent' && (
              <div className={styles.splitTools}>
                <button
                  type="button"
                  className={ledgerStyles.textBtn}
                  onClick={() => setValues(prev => ({ ...prev, percent: evenPercents(members.map(m => m.id)) }))}
                  disabled={saving}
                >
                  Even split
                </button>
              </div>
            )}
            <ul className={styles.splitRows}>
              {members.map(m => {
                const share = preview.shares?.get(m.id);
                const inSplit = splitType === 'equal' ? included.has(m.id) : Number(values[splitType][m.id]) > 0;
                return (
                  <li key={m.id} className={cx(styles.splitRow, !inSplit && styles.splitRowOut)}>
                    {splitType === 'equal' ? (
                      <label className={styles.splitWho}>
                        <input type="checkbox" checked={included.has(m.id)} onChange={() => toggleIncluded(m.id)} disabled={saving} />
                        <span>{m.name}</span>
                      </label>
                    ) : (
                      <>
                        <label className={styles.splitWho} htmlFor={`ge-v-${m.id}`}>{m.name}</label>
                        <span className={styles.splitInputWrap}>
                          {splitType === 'exact' && <span className={styles.unit} aria-hidden="true">₹</span>}
                          <input
                            id={`ge-v-${m.id}`}
                            className={styles.splitInput}
                            type="text"
                            inputMode="decimal"
                            value={values[splitType][m.id] ?? ''}
                            onChange={e => setValue(m.id, e.target.value)}
                            placeholder="0"
                            disabled={saving}
                          />
                          {splitType !== 'exact' && <span className={styles.unit} aria-hidden="true">{UNIT[splitType]}</span>}
                        </span>
                      </>
                    )}
                    <span className={styles.splitShare}>{inSplit && share !== undefined ? `₹${formatAmount(share / 100)}` : '—'}</span>
                  </li>
                );
              })}
            </ul>
            <div className={cx(styles.splitStatus, preview.ready ? styles.statusOk : styles.statusPending)} aria-live="polite">
              {preview.status}
            </div>
          </div>

          <label className={cx(ledgerStyles.toggleRow, addMyShare && ledgerStyles.toggleOn)}>
            <input type="checkbox" checked={addMyShare} onChange={e => setAddMyShare(e.target.checked)} disabled={saving} />
            <span>
              Add my share{mySharePaise > 0 ? ` (₹${formatAmount(mySharePaise / 100)})` : ''} to my expenses
              <span className={ledgerStyles.toggleHint}>Saved as a normal expense for this month</span>
            </span>
          </label>

          {addMyShare && (
            <>
              <ChoiceGroup
                label="Category"
                customLabel="custom category"
                options={CATEGORIES}
                renderOption={cat => <><span aria-hidden="true">{getCategoryIcon(cat)}</span> {getCategoryLabel(cat)}</>}
                optionTitle={cat => cat}
                customOption={<><span aria-hidden="true">✏️</span> Custom</>}
                value={category}
                customValue={customCategory}
                customPlaceholder="Gym membership"
                disabled={saving}
                onChange={value => { setCategoryPicked(true); setCategory(value); if (value !== CUSTOM) setCustomCategory(''); }}
                onCustomChange={setCustomCategory}
              />
              <ChoiceGroup
                label="Paid with"
                customLabel="custom payment method"
                options={PAYMENT_METHODS}
                renderOption={pm => pm}
                customOption={<><span aria-hidden="true">✏️</span> Custom</>}
                value={paymentMethod}
                customValue={customPayment}
                customPlaceholder="Amazon Pay"
                disabled={saving}
                onChange={value => { setPaymentMethod(value); if (value !== CUSTOM) setCustomPayment(''); }}
                onCustomChange={setCustomPayment}
              />
            </>
          )}

          <DateChoice value={date} disabled={saving} onChange={setDate} />

          <div className={sheet.actions}>
            <button type="button" className={sheet.cancel} onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className={sheet.submit} disabled={saving}>
              {saving ? <><span className={sheet.spinner} /> Saving…</> : 'Save expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupExpenseSheet;
