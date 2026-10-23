import { useState } from 'react';
import { todayISO } from '../../shared/dates.js';
import ChoiceGroup from '../../shared/form/ChoiceGroup.jsx';
import DateChoice from '../../shared/form/DateChoice.jsx';
import { useAddGroupSettlement } from './queries.js';
import { useLockPageScroll } from '../../shared/form/useLockPageScroll.js';
import sheet from '../../shared/form/SheetForm.module.css';

const amountText = (rupees) => (Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2));

// Money handed over between any two members. `preset` ({ from, to, amount }) comes from a
// suggested payment, so recording it is one tap plus Save.
const GroupSettleSheet = ({ group, members, preset, onClose }) => {
  useLockPageScroll();
  const addSettlement = useAddGroupSettlement();
  const self = members.find(m => m.isSelf);
  const [from, setFrom] = useState(preset?.from ?? members.find(m => !m.isSelf)?.id);
  const [to, setTo] = useState(preset?.to ?? self?.id);
  const [amount, setAmount] = useState(preset ? amountText(preset.amount) : '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState('');

  const nameOf = (id) => members.find(m => m.id === id)?.name ?? '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) { setError('Enter an amount greater than 0.'); return; }
    if (!from || !to || from === to) { setError('Pick two different people.'); return; }
    setError('');
    try {
      await addSettlement.mutateAsync({
        groupId: group.id,
        settlement: { fromPersonId: from, toPersonId: to, amount: value, date, note: note.trim() || undefined },
      });
      onClose();
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Couldn\'t reach the server. Check your connection and try again.'
        : err.message || 'Couldn\'t save this. Try again.');
    }
  };

  const saving = addSettlement.isPending;

  return (
    <div className={sheet.overlay} onClick={onClose}>
      <div className={sheet.modal} onClick={e => e.stopPropagation()}>
        <div className={sheet.handle} />
        <div className={sheet.header}>
          <div className={sheet.headerTitle}><span aria-hidden="true">✅</span> Record a payment</div>
          <button type="button" className={sheet.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className={sheet.body} onSubmit={handleSubmit} noValidate>
          {error && <div className={sheet.error} role="alert"><span aria-hidden="true">⚠️</span> {error}</div>}

          <ChoiceGroup
            label="Who paid"
            options={members.map(m => m.id)}
            renderOption={nameOf}
            value={from}
            disabled={saving}
            onChange={id => { setFrom(id); if (id === to) setTo(members.find(m => m.id !== id)?.id); }}
          />
          <ChoiceGroup
            label="Paid to"
            options={members.filter(m => m.id !== from).map(m => m.id)}
            renderOption={nameOf}
            value={to}
            disabled={saving}
            onChange={setTo}
          />

          <div className={sheet.amountHero}>
            <label className={sheet.label} htmlFor="gs-amount">
              {from && to ? `${nameOf(from)} paid ${nameOf(to) === 'You' ? 'you' : nameOf(to)}` : 'Amount'}
            </label>
            <div className={sheet.amountWrap}>
              <span className={sheet.currency} aria-hidden="true">₹</span>
              <input
                id="gs-amount"
                className={sheet.amountInput}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={e => { if (e.target.value === '' || /^\d*\.?\d{0,2}$/.test(e.target.value)) setAmount(e.target.value); }}
                placeholder="0"
                disabled={saving}
                autoFocus
              />
            </div>
          </div>

          <div className={sheet.field}>
            <label className={sheet.label} htmlFor="gs-note">Note (optional)</label>
            <input
              id="gs-note"
              className={sheet.input}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Paid over UPI"
              disabled={saving}
            />
          </div>

          <DateChoice value={date} disabled={saving} onChange={setDate} />

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

export default GroupSettleSheet;
