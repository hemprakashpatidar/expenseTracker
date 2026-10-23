import { useState } from 'react';
import { useNavigate } from 'react-router';
import { cx } from '../../shared/cx.js';
import { useAllPeople, useCreateGroup } from './queries.js';
import { GROUP_EMOJIS } from './emojis.js';
import { useLockPageScroll } from '../../shared/form/useLockPageScroll.js';
import sheet from '../../shared/form/SheetForm.module.css';
import ledgerStyles from '../ledger/Ledger.module.css';
import styles from './Groups.module.css';

// Name, emoji, members (from any ledger, or new names) and the simplify-debts switch
const NewGroupSheet = ({ onClose }) => {
  useLockPageScroll();
  const navigate = useNavigate();
  const createGroup = useCreateGroup();
  const { data: peopleData, isLoading } = useAllPeople();
  const people = peopleData?.people ?? [];
  const showLedgers = new Set(people.map(p => p.ledger?.id)).size > 1;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(GROUP_EMOJIS[0]);
  const [selected, setSelected] = useState(() => new Set());
  const [newNames, setNewNames] = useState([]);
  const [newName, setNewName] = useState('');
  const [simplifyDebts, setSimplifyDebts] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const addNewName = () => {
    const value = newName.trim();
    if (!value) return;
    if (newNames.some(n => n.toLowerCase() === value.toLowerCase())) { setNewName(''); return; }
    setNewNames(prev => [...prev, value]);
    setNewName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Give the group a name.'); return; }
    if (selected.size === 0 && newNames.length === 0) { setError('Add at least one other person.'); return; }
    setError('');
    try {
      const result = await createGroup.mutateAsync({
        name: name.trim(),
        emoji,
        simplifyDebts,
        memberIds: [...selected],
        newMemberNames: newNames,
      });
      onClose();
      navigate(`/groups/${result.group.id}`);
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Couldn\'t reach the server. Check your connection and try again.'
        : err.message || 'Couldn\'t create the group. Try again.');
    }
  };

  const saving = createGroup.isPending;

  return (
    <div className={sheet.overlay} onClick={onClose}>
      <div className={sheet.modal} onClick={e => e.stopPropagation()}>
        <div className={sheet.handle} />
        <div className={sheet.header}>
          <div className={sheet.headerTitle}><span aria-hidden="true">{emoji}</span> New group</div>
          <button type="button" className={sheet.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className={sheet.body} onSubmit={handleSubmit} noValidate>
          {error && <div className={sheet.error} role="alert"><span aria-hidden="true">⚠️</span> {error}</div>}

          <div className={sheet.field}>
            <label className={sheet.label} htmlFor="ng-name">Name</label>
            <input
              id="ng-name"
              className={sheet.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Goa trip"
              disabled={saving}
              autoFocus
            />
          </div>

          <fieldset className={sheet.fieldset}>
            <legend className={sheet.label}>Icon</legend>
            <div className={sheet.chipRow}>
              {GROUP_EMOJIS.map(value => (
                <button
                  key={value}
                  type="button"
                  className={cx(sheet.chip, styles.emojiChip, emoji === value && sheet.selected)}
                  aria-pressed={emoji === value}
                  aria-label={`Icon ${value}`}
                  onClick={() => setEmoji(value)}
                  disabled={saving}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={sheet.fieldset}>
            <legend className={sheet.label}>Members (you're always in)</legend>
            {isLoading ? (
              <div className={styles.hint}>Loading your people…</div>
            ) : (
              <div className={sheet.chips}>
                {people.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={cx(sheet.chip, selected.has(p.id) && sheet.selected)}
                    aria-pressed={selected.has(p.id)}
                    onClick={() => toggle(p.id)}
                    disabled={saving}
                  >
                    {selected.has(p.id) && <span aria-hidden="true">✓</span>} {p.name}
                    {showLedgers && <span className={styles.chipTag}>{p.ledger?.name}</span>}
                  </button>
                ))}
                {newNames.map(n => (
                  <button
                    key={`new-${n}`}
                    type="button"
                    className={cx(sheet.chip, sheet.selected)}
                    aria-label={`Remove ${n}`}
                    onClick={() => setNewNames(prev => prev.filter(x => x !== n))}
                    disabled={saving}
                  >
                    {n} <span className={styles.chipTag}>new</span> <span aria-hidden="true">✕</span>
                  </button>
                ))}
              </div>
            )}
            <div className={styles.newMemberRow}>
              <input
                className={sheet.input}
                aria-label="New person's name"
                placeholder="Add someone new"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewName(); } }}
                disabled={saving}
              />
              <button type="button" className={ledgerStyles.primaryBtn} onClick={addNewName} disabled={saving || !newName.trim()}>
                Add
              </button>
            </div>
            <div className={styles.hint}>New people are added to your first ledger.</div>
          </fieldset>

          <label className={cx(ledgerStyles.toggleRow, simplifyDebts && ledgerStyles.toggleOn)}>
            <input type="checkbox" checked={simplifyDebts} onChange={e => setSimplifyDebts(e.target.checked)} disabled={saving} />
            <span>
              Simplify debts
              <span className={ledgerStyles.toggleHint}>
                Fewest payments to settle up. Someone may end up paying a person they didn't share an expense with.
              </span>
            </span>
          </label>

          <div className={sheet.actions}>
            <button type="button" className={sheet.cancel} onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className={sheet.submit} disabled={saving}>
              {saving ? <><span className={sheet.spinner} /> Creating…</> : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGroupSheet;
