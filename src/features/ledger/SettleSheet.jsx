import { useState } from 'react';
import { todayISO } from '../../shared/dates.js';
import ChoiceGroup from '../../shared/form/ChoiceGroup.jsx';
import DateChoice from '../../shared/form/DateChoice.jsx';
import { useCreateSettlement } from './queries.js';
import { toPaise } from './split.js';
import { formatRupees } from './balance.js';
import sheet from '../../shared/form/SheetForm.module.css';
import styles from './Ledger.module.css';

// Whole rupees stay whole; paise keep two decimals ("600.5" would read oddly)
const amountText = (rupees) => (Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2));

// Record money handed over. Starts as "settle everything", in the direction that clears the balance.
const SettleSheet = ({ person, onClose }) => {
  const createSettlement = useCreateSettlement();
  const balance = person.balance;
  const [form, setForm] = useState({
    direction: balance < 0 ? 'i_paid' : 'they_paid',
    amount: balance !== 0 ? amountText(Math.abs(balance)) : '',
    date: todayISO(),
    note: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // What the balance becomes, in paise (positive: they owe you)
  const amountPaise = toPaise(form.amount || 0);
  const after = toPaise(balance) + (form.direction === 'they_paid' ? -amountPaise : amountPaise);
  const outcome = amountPaise <= 0 ? null
    : after === 0 ? 'All square after this'
    : after > 0 ? `${person.name} will still owe you ${formatRupees(after / 100)}`
    : `You'll owe ${person.name} ${formatRupees(after / 100)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await createSettlement.mutateAsync({
        personId: person.id,
        direction: form.direction,
        amount,
        date: form.date,
        note: form.note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Couldn\'t reach the server. Check your connection and try again.'
        : err.message || 'Couldn\'t save this. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className={sheet.overlay} onClick={onClose}>
      <div className={sheet.modal} onClick={e => e.stopPropagation()}>
        <div className={sheet.handle} />
        <div className={sheet.header}>
          <div className={sheet.headerTitle}><span aria-hidden="true">✅</span> Settle up with {person.name}</div>
          <button type="button" className={sheet.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className={sheet.body} onSubmit={handleSubmit} noValidate>
          {error && <div className={sheet.error} role="alert"><span aria-hidden="true">⚠️</span> {error}</div>}

          <ChoiceGroup
            label="Who paid"
            options={['they_paid', 'i_paid']}
            renderOption={value => (value === 'they_paid' ? `${person.name} paid me` : `I paid ${person.name}`)}
            value={form.direction}
            disabled={saving}
            onChange={value => set('direction', value)}
          />

          <div className={sheet.amountHero}>
            <label className={sheet.label} htmlFor="st-amount">Amount</label>
            <div className={sheet.amountWrap}>
              <span className={sheet.currency} aria-hidden="true">₹</span>
              <input
                id="st-amount"
                className={sheet.amountInput}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={form.amount}
                onChange={e => {
                  if (e.target.value === '' || /^\d*\.?\d{0,2}$/.test(e.target.value)) set('amount', e.target.value);
                }}
                placeholder="0"
                disabled={saving}
                autoFocus
              />
            </div>
          </div>

          {outcome && <div className={styles.splitPreview} aria-live="polite"><span className={styles.splitOutcome}>{outcome}</span></div>}

          <div className={sheet.field}>
            <label className={sheet.label} htmlFor="st-note">Note (optional)</label>
            <input
              id="st-note"
              className={sheet.input}
              type="text"
              value={form.note}
              onChange={e => set('note', e.target.value)}
              placeholder="Paid back over UPI"
              disabled={saving}
            />
          </div>

          <DateChoice value={form.date} disabled={saving} onChange={value => set('date', value)} />

          <div className={sheet.actions}>
            <button type="button" className={sheet.cancel} onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className={sheet.submit} disabled={saving}>
              {saving ? <><span className={sheet.spinner} /> Saving…</> : 'Record payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettleSheet;
