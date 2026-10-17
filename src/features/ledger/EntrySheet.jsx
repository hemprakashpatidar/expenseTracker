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
import { useCreateEntry, useCreatePerson } from './queries.js';
import { previewSplit } from './split.js';
import sheet from '../../shared/form/SheetForm.module.css';
import styles from './Ledger.module.css';

const TYPES = [
  { value: 'split', label: '🍽️ Split a bill' },
  { value: 'lent', label: '💸 I lent' },
  { value: 'borrowed', label: '🤝 I borrowed' },
];

const resolve = (selected, custom) => (selected === CUSTOM ? custom.trim() : selected);
const rupees = (paise) => `₹${formatAmount(paise / 100)}`;

// A new ledger entry with one person: split a bill, money lent, or money borrowed.
// `person` fixes who it's with (from their page); otherwise you pick, or add someone new
// to `ledgerId`.
// onSaved({ shareNotAdded }) runs before closing, so the page can show a notice.
const EntrySheet = ({ people = [], person, ledgerId, onClose, onSaved }) => {
  const createEntry = useCreateEntry();
  const createPerson = useCreatePerson();
  const lastPayment = getLastPaymentMethod() || 'UPI';

  const [form, setForm] = useState({
    personId: person?.id || '',
    newPersonName: '',
    type: 'split',
    amount: '',
    description: '',
    paidBy: 'me',
    splitMode: 'equal',
    myShare: '',
    date: todayISO(),
    addMyShare: false,
    category: '',
    customCategory: '',
    paymentMethod: PAYMENT_METHODS.includes(lastPayment) ? lastPayment : CUSTOM,
    customPayment: PAYMENT_METHODS.includes(lastPayment) ? '' : lastPayment,
  });
  const [categoryPicked, setCategoryPicked] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const otherName = person?.name
    || people.find(p => p.id === form.personId)?.name
    || form.newPersonName.trim()
    || 'them';
  const isSplit = form.type === 'split';
  const shares = isSplit ? previewSplit({ amount: form.amount, paidBy: form.paidBy, mode: form.splitMode, myShare: form.myShare }) : null;

  const handleAmountChange = (field) => (e) => {
    if (e.target.value === '' || /^\d*\.?\d{0,2}$/.test(e.target.value)) set(field, e.target.value);
  };

  // Like the expense form, the category follows the description until you pick one
  const handleDescriptionChange = (value) => {
    setForm(prev => categoryPicked
      ? { ...prev, description: value }
      : { ...prev, description: value, category: matchCategory(value) || '', customCategory: '' });
  };

  const validate = () => {
    if (!person && !form.personId) return 'Choose who this is with.';
    if (!person && form.personId === CUSTOM && !form.newPersonName.trim()) return 'Enter their name.';
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) return 'Enter an amount greater than 0.';
    if (isSplit && !form.description.trim()) return 'Add what the bill was for.';
    if (isSplit && form.splitMode === 'exact' && !shares) return 'Your share must be between 0 and the total.';
    if (isSplit && form.addMyShare && !resolve(form.category, form.customCategory)) return 'Pick a category for your share.';
    if (isSplit && form.addMyShare && !resolve(form.paymentMethod, form.customPayment)) return 'Pick how you paid for your share.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError('');
    setSaving(true);

    try {
      let personId = person?.id || form.personId;
      if (personId === CUSTOM) {
        personId = (await createPerson.mutateAsync({ name: form.newPersonName.trim(), ledgerId })).id;
        // If the entry below fails, a retry uses this person instead of creating them again
        setForm(prev => ({ ...prev, personId, newPersonName: '' }));
      }

      const base = {
        personId,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description.trim() || undefined,
      };
      const paymentMethod = resolve(form.paymentMethod, form.customPayment);
      const entry = isSplit
        ? {
            ...base,
            type: 'split',
            paidBy: form.paidBy,
            split: form.splitMode === 'equal' ? { mode: 'equal' } : { mode: 'exact', myShare: parseFloat(form.myShare) },
            addMyShare: form.addMyShare,
            ...(form.addMyShare ? { category: resolve(form.category, form.customCategory), paymentMethod } : {}),
          }
        : { ...base, type: form.type };

      const result = await createEntry.mutateAsync(entry);
      if (entry.addMyShare) saveLastPaymentMethod(paymentMethod);
      // The ledger entry is saved even if copying your share into expenses failed
      onSaved?.({ shareNotAdded: Boolean(entry.addMyShare && !result.myShareAdded) });
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
          <div className={sheet.headerTitle}>
            {person ? <>New entry with {person.name}</> : <><span aria-hidden="true">🤝</span> New entry</>}
          </div>
          <button type="button" className={sheet.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className={sheet.body} onSubmit={handleSubmit} noValidate>
          {error && <div className={sheet.error} role="alert"><span aria-hidden="true">⚠️</span> {error}</div>}

          {!person && (
            <ChoiceGroup
              label="With"
              customLabel="new person"
              options={people.map(p => p.id)}
              renderOption={id => people.find(p => p.id === id)?.name ?? '…'}
              customOption={<><span aria-hidden="true">＋</span> New person</>}
              value={form.personId}
              customValue={form.newPersonName}
              customPlaceholder="Their name"
              disabled={saving}
              onChange={value => set('personId', value)}
              onCustomChange={value => set('newPersonName', value)}
            />
          )}

          <ChoiceGroup
            label="Type"
            options={TYPES.map(t => t.value)}
            renderOption={value => TYPES.find(t => t.value === value).label}
            value={form.type}
            disabled={saving}
            onChange={value => set('type', value)}
          />

          <div className={sheet.amountHero}>
            <label className={sheet.label} htmlFor="le-amount">
              {isSplit ? 'Total bill' : form.type === 'lent' ? `You gave ${otherName}` : `${otherName} gave you`}
            </label>
            <div className={sheet.amountWrap}>
              <span className={sheet.currency} aria-hidden="true">₹</span>
              <input
                id="le-amount"
                className={sheet.amountInput}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={form.amount}
                onChange={handleAmountChange('amount')}
                placeholder="0"
                disabled={saving}
                autoFocus={Boolean(person)}
              />
            </div>
          </div>

          <div className={sheet.field}>
            <label className={sheet.label} htmlFor="le-description">
              {isSplit ? 'What was it for?' : 'Note (optional)'}
            </label>
            <input
              id="le-description"
              className={sheet.input}
              type="text"
              value={form.description}
              onChange={e => handleDescriptionChange(e.target.value)}
              placeholder={isSplit ? 'Dinner at Toit' : 'For the concert tickets'}
              disabled={saving}
            />
          </div>

          {isSplit && (
            <>
              <ChoiceGroup
                label="Paid by"
                options={['me', 'them']}
                renderOption={value => (value === 'me' ? 'You' : otherName)}
                value={form.paidBy}
                disabled={saving}
                onChange={value => set('paidBy', value)}
              />

              <ChoiceGroup
                label="Split"
                options={['equal', 'exact']}
                renderOption={value => (value === 'equal' ? 'Equally' : 'Exact amounts')}
                value={form.splitMode}
                disabled={saving}
                onChange={value => set('splitMode', value)}
              />

              {form.splitMode === 'exact' && (
                <div className={sheet.field}>
                  <label className={sheet.label} htmlFor="le-my-share">Your share</label>
                  <input
                    id="le-my-share"
                    className={sheet.input}
                    type="text"
                    inputMode="decimal"
                    value={form.myShare}
                    onChange={handleAmountChange('myShare')}
                    placeholder="0"
                    disabled={saving}
                  />
                </div>
              )}

              {shares && (
                <div className={styles.splitPreview} aria-live="polite">
                  <span>You <strong>{rupees(shares.mine)}</strong></span>
                  <span>{otherName} <strong>{rupees(shares.theirs)}</strong></span>
                  <span className={styles.splitOutcome}>
                    {form.paidBy === 'me'
                      ? `${otherName} will owe you ${rupees(shares.theirs)}`
                      : `You'll owe ${otherName} ${rupees(shares.mine)}`}
                  </span>
                </div>
              )}

              <label className={cx(styles.toggleRow, form.addMyShare && styles.toggleOn)}>
                <input
                  type="checkbox"
                  checked={form.addMyShare}
                  onChange={e => set('addMyShare', e.target.checked)}
                  disabled={saving}
                />
                <span>
                  Add my share{shares ? ` (${rupees(shares.mine)})` : ''} to my expenses
                  <span className={styles.toggleHint}>Saved as a normal expense for this month</span>
                </span>
              </label>

              {form.addMyShare && (
                <>
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
                    disabled={saving}
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
                    disabled={saving}
                    onChange={value => setForm(prev => ({ ...prev, paymentMethod: value, customPayment: value === CUSTOM ? prev.customPayment : '' }))}
                    onCustomChange={value => set('customPayment', value)}
                  />
                </>
              )}
            </>
          )}

          <DateChoice value={form.date} disabled={saving} onChange={value => set('date', value)} />

          <div className={sheet.actions}>
            <button type="button" className={sheet.cancel} onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className={sheet.submit} disabled={saving}>
              {saving ? <><span className={sheet.spinner} /> Saving…</> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntrySheet;
