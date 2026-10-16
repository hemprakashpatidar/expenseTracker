import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { formatDayHeading } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import Fab from '../../shared/Fab.jsx';
import { usePeople, usePerson, useDeleteEntry, useDeleteSettlement, useUpdatePerson } from './queries.js';
import { balanceHeading, formatRupees } from './balance.js';
import EntrySheet from './EntrySheet.jsx';
import SettleSheet from './SettleSheet.jsx';
import skeleton from '../../shared/Skeleton.module.css';
import page from '../../shared/Page.module.css';
import styles from './Ledger.module.css';

const ICONS = { lent: '💸', borrowed: '🤝', split: '🍽️', settlement: '✅' };

// Title and detail line for one history row, from your point of view
const describe = (item, name) => {
  switch (item.type) {
    case 'lent':
      return { title: `You lent ${name}`, detail: item.description !== 'Money lent' ? item.description : '' };
    case 'borrowed':
      return { title: `You borrowed from ${name}`, detail: item.description !== 'Money borrowed' ? item.description : '' };
    case 'split': {
      const who = item.paidBy === 'me' ? `You paid ${formatRupees(item.amount)}` : `${name} paid ${formatRupees(item.amount)}`;
      const share = item.paidBy === 'me' ? `${name}'s share ${formatRupees(item.theirShare)}` : `your share ${formatRupees(item.myShare)}`;
      return { title: item.description, detail: `${who} · ${share}${item.addedToExpenses ? ' · in your expenses' : ''}` };
    }
    case 'settlement':
      return { title: item.direction === 'they_paid' ? `${name} paid you` : `You paid ${name}`, detail: item.note || '' };
    default:
      return { title: '', detail: '' };
  }
};

const groupByDate = (items) => items.reduce((groups, item) => {
  const last = groups[groups.length - 1];
  if (last && last.date === item.date) last.items.push(item);
  else groups.push({ date: item.date, items: [item] });
  return groups;
}, []);

const ActivityRow = ({ item, name, expanded, onToggle, onDelete, deleting }) => {
  const [confirming, setConfirming] = useState(false);
  const { title, detail } = describe(item, name);
  // effect > 0: they owe you more; < 0: they owe you less (or you owe them more)
  const tone = item.effect > 0 ? 'owed' : item.effect < 0 ? 'owe' : 'settled';
  const sign = item.effect > 0 ? '+' : item.effect < 0 ? '−' : '';
  const linkedExpense = item.type === 'split' && item.addedToExpenses;

  return (
    <li className={cx(styles.activity, expanded && styles.activityOpen)}>
      <button className={styles.activityMain} onClick={() => { setConfirming(false); onToggle(); }} aria-expanded={expanded}>
        <span className={styles.activityIcon} aria-hidden="true">{ICONS[item.type]}</span>
        <span className={styles.personInfo}>
          <span className={styles.personName}>{title}</span>
          {detail && <span className={styles.personMeta}>{detail}</span>}
        </span>
        <span className={cx(styles.effect, styles[tone])}>
          {sign}{formatRupees(item.effect)}
        </span>
      </button>

      {expanded && (
        <div className={styles.activityActions}>
          {confirming ? (
            <>
              <span className={styles.confirmText}>
                {linkedExpense ? 'Delete this and the matching expense?' : 'Delete this entry?'}
              </span>
              <button className={styles.textBtn} onClick={() => setConfirming(false)}>Keep</button>
              <button className={styles.dangerBtn} onClick={onDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          ) : (
            <button className={styles.textBtn} onClick={() => setConfirming(true)}>
              <span aria-hidden="true">🗑</span> Delete
            </button>
          )}
        </div>
      )}
    </li>
  );
};

const RenamePerson = ({ person, onDone }) => {
  const updatePerson = useUpdatePerson();
  const [name, setName] = useState(person.name);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Enter a name.'); return; }
    try {
      await updatePerson.mutateAsync({ id: person.id, changes: { name: name.trim() } });
      onDone();
    } catch (err) {
      setError(err.message || 'Couldn\'t rename. Try again.');
    }
  };

  return (
    <form className={styles.addPerson} onSubmit={handleSubmit}>
      <input
        className={styles.addPersonInput}
        aria-label="New name"
        value={name}
        onChange={e => { setName(e.target.value); setError(''); }}
        disabled={updatePerson.isPending}
        autoFocus
      />
      <button type="submit" className={styles.primaryBtn} disabled={updatePerson.isPending}>Save</button>
      <button type="button" className={styles.textBtn} onClick={onDone}>Cancel</button>
      {error && <div className={styles.inlineError} role="alert">{error}</div>}
    </form>
  );
};

const PersonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = usePerson(id);
  const { data: peopleData } = usePeople();
  const deleteEntry = useDeleteEntry();
  const deleteSettlement = useDeleteSettlement();
  const updatePerson = useUpdatePerson();

  const [sheet, setSheet] = useState(null); // 'entry' | 'settle' | null
  const [expandedId, setExpandedId] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [notice, setNotice] = useState('');

  const person = data?.person;
  const activity = data?.activity ?? [];

  const handleDelete = async (item) => {
    try {
      if (item.type === 'settlement') {
        await deleteSettlement.mutateAsync(item.id);
      } else {
        const result = await deleteEntry.mutateAsync(item.id);
        if (result.myShareRemoved === false) {
          setNotice('Deleted. The matching expense couldn\'t be removed, so delete it on the Expenses tab.');
        }
      }
      setExpandedId(null);
    } catch (err) {
      setNotice(err.message || 'Couldn\'t delete. Try again.');
    }
  };

  const handleArchive = async () => {
    try {
      await updatePerson.mutateAsync({ id: person.id, changes: { archived: true } });
      navigate('/people');
    } catch (err) {
      setNotice(err.message || 'Couldn\'t archive. Try again.');
    }
  };

  return (
    <div className={page.root}>
      <div className={page.app}>
        <header className={styles.personHeader}>
          <Link to="/people" className={styles.back} aria-label="Back to people">‹</Link>
          <h1 className={styles.personTitle}>{person?.name ?? ' '}</h1>
        </header>

        {isLoading ? (
          <div className={cx(skeleton.block, styles.balanceSkeleton)} />
        ) : isError ? (
          <section className={styles.card}>
            <div className={styles.empty}>
              <div>{error?.message || 'Couldn\'t load this person.'}</div>
              <button className={styles.textBtn} onClick={() => refetch()}>Try again</button>
            </div>
          </section>
        ) : (
          <>
            <section className={styles.summary} aria-label="Balance">
              <div className={styles.summaryLabel}>{balanceHeading(person.name, person.balance)}</div>
              {person.balance !== 0 && <div className={styles.summaryAmount}>{formatRupees(person.balance)}</div>}
              <div className={styles.summaryActions}>
                {person.balance !== 0 && !person.archived && (
                  <button className={styles.heroBtn} onClick={() => setSheet('settle')}>Settle up</button>
                )}
                {!person.archived && (
                  <button className={cx(styles.heroBtn, styles.heroBtnGhost)} onClick={() => setSheet('entry')}>Add entry</button>
                )}
              </div>
            </section>

            {notice && (
              <div className={styles.notice} role="status">
                {notice}
                <button className={styles.textBtn} onClick={() => setNotice('')}>Dismiss</button>
              </div>
            )}

            <section className={styles.card} aria-labelledby="history-heading">
              <div className={styles.cardHeader}>
                <h2 id="history-heading" className={styles.cardTitle}>History</h2>
              </div>
              {activity.length === 0 ? (
                <div className={styles.empty}>
                  <div>Nothing yet. Add what you lent, borrowed, or split with {person.name}.</div>
                </div>
              ) : (
                groupByDate(activity).map(group => (
                  <div key={group.date} className={styles.day}>
                    <div className={styles.dayHeading}>{formatDayHeading(group.date)}</div>
                    <ul className={styles.activities}>
                      {group.items.map(item => (
                        <ActivityRow
                          key={`${item.type}-${item.id}`}
                          item={item}
                          name={person.name}
                          expanded={expandedId === item.id}
                          onToggle={() => setExpandedId(current => (current === item.id ? null : item.id))}
                          onDelete={() => handleDelete(item)}
                          deleting={deleteEntry.isPending || deleteSettlement.isPending}
                        />
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>

            {!person.archived && (
              <section className={styles.manage}>
                {renaming ? (
                  <RenamePerson person={person} onDone={() => setRenaming(false)} />
                ) : (
                  <>
                    <button className={styles.textBtn} onClick={() => setRenaming(true)}>Rename</button>
                    {person.balance === 0 && (
                      <button className={styles.textBtn} onClick={handleArchive} disabled={updatePerson.isPending}>
                        Archive {person.name}
                      </button>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {person && !person.archived && <Fab label={`New entry with ${person.name}`} onClick={() => setSheet('entry')} />}

      {sheet === 'entry' && person && (
        <EntrySheet
          person={person}
          people={peopleData?.people}
          onClose={() => setSheet(null)}
          onSaved={({ shareNotAdded }) => {
            if (shareNotAdded) setNotice('Saved. Your share couldn\'t be added to your expenses, so add it there by hand.');
          }}
        />
      )}
      {sheet === 'settle' && person && <SettleSheet person={person} onClose={() => setSheet(null)} />}
    </div>
  );
};

export default PersonPage;
