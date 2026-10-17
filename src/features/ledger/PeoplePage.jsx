import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/useAuth.js';
import { getAuthData } from '../auth/session.js';
import AppHeader from '../../shared/AppHeader.jsx';
import Fab from '../../shared/Fab.jsx';
import { formatShortDate } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import { useLedgers, usePeople, useCreatePerson } from './queries.js';
import { useSelectedLedger } from './useSelectedLedger.js';
import LedgerSwitcher from './LedgerSwitcher.jsx';
import { balanceShort, balanceTone, formatRupees } from './balance.js';
import EntrySheet from './EntrySheet.jsx';
import skeleton from '../../shared/Skeleton.module.css';
import page from '../../shared/Page.module.css';
import styles from './Ledger.module.css';

// Indigo card with your position across everyone in this ledger
const LedgerSummary = ({ ledgerName, totals, isLoading }) => {
  const net = totals ? totals.owedToYou - totals.youOwe : 0;
  return (
    <section className={styles.summary} aria-label={`Balance in ${ledgerName || 'this ledger'}`}>
      <div className={styles.summaryLabel}>{ledgerName ? `In ${ledgerName}` : 'Overall'}</div>
      {isLoading || !totals ? (
        <div className={cx(skeleton.block, styles.summarySkeleton)} />
      ) : (
        <>
          <div className={styles.summaryAmount}>
            {net > 0 ? <>You're owed {formatRupees(net)}</>
              : net < 0 ? <>You owe {formatRupees(net)}</>
              : 'All settled up'}
          </div>
          <div className={styles.summaryMeta}>
            {formatRupees(totals.owedToYou)} owed to you · {formatRupees(totals.youOwe)} you owe
          </div>
        </>
      )}
    </section>
  );
};

const AddPerson = ({ ledgerId, onDone }) => {
  const createPerson = useCreatePerson();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Enter a name.'); return; }
    try {
      await createPerson.mutateAsync({ name: name.trim(), ledgerId });
      onDone();
    } catch (err) {
      setError(err.message || 'Couldn\'t add them. Try again.');
    }
  };

  return (
    <form className={styles.addPerson} onSubmit={handleSubmit}>
      <input
        className={styles.addPersonInput}
        aria-label="Name"
        placeholder="Their name"
        value={name}
        onChange={e => { setName(e.target.value); setError(''); }}
        disabled={createPerson.isPending}
        autoFocus
      />
      <button type="submit" className={styles.primaryBtn} disabled={createPerson.isPending}>Add</button>
      <button type="button" className={styles.textBtn} onClick={onDone}>Cancel</button>
      {error && <div className={styles.inlineError} role="alert">{error}</div>}
    </form>
  );
};

const PersonRow = ({ person }) => {
  const tone = balanceTone(person.balance);
  return (
    <li>
      <Link to={`/people/${person.id}`} className={styles.personRow}>
        <span className={styles.avatar} aria-hidden="true">{person.name[0]?.toUpperCase()}</span>
        <span className={styles.personInfo}>
          <span className={styles.personName}>{person.name}</span>
          <span className={styles.personMeta}>
            {person.lastActivityOn ? `Last activity ${formatShortDate(person.lastActivityOn)}` : 'No entries yet'}
          </span>
        </span>
        <span className={cx(styles.balance, styles[tone])}>{balanceShort(person.balance)}</span>
      </Link>
    </li>
  );
};

const PeoplePage = () => {
  const { logout } = useAuth();
  const currentUser = getAuthData();
  const ledgersQuery = useLedgers();
  const { ledgerId, ledger, select } = useSelectedLedger(ledgersQuery.data);
  const peopleQuery = usePeople(ledgerId);
  const data = peopleQuery.data;
  // The list waits for ledgers first, then for that ledger's people
  const isLoading = ledgersQuery.isLoading || (Boolean(ledgerId) && peopleQuery.isLoading);
  const isError = ledgersQuery.isError || peopleQuery.isError;
  const error = ledgersQuery.error || peopleQuery.error;
  const refetch = () => (ledgersQuery.isError ? ledgersQuery.refetch() : peopleQuery.refetch());
  const [adding, setAdding] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const people = data?.people ?? [];

  return (
    <div className={page.root}>
      <div className={page.app}>
        <AppHeader title="People" userName={currentUser?.userName} onLogout={logout} />

        {!ledgersQuery.isError && (
          <LedgerSwitcher ledgers={ledgersQuery.data ?? []} current={ledger} onSelect={select} />
        )}

        <LedgerSummary ledgerName={ledger?.name} totals={data?.totals} isLoading={isLoading} />

        {notice && (
          <div className={styles.notice} role="status">
            {notice}
            <button className={styles.textBtn} onClick={() => setNotice('')}>Dismiss</button>
          </div>
        )}

        <section className={styles.card} aria-labelledby="people-heading">
          <div className={styles.cardHeader}>
            <h2 id="people-heading" className={styles.cardTitle}>Your people</h2>
            {!adding && (
              <button className={styles.textBtn} onClick={() => setAdding(true)}>
                <span aria-hidden="true">＋</span> Add person
              </button>
            )}
          </div>

          {adding && <AddPerson ledgerId={ledgerId} onDone={() => setAdding(false)} />}

          {isLoading ? (
            <div className={styles.rowsSkeleton}>
              {[0, 1, 2].map(i => <div key={i} className={cx(skeleton.block, styles.rowSkeleton)} />)}
            </div>
          ) : isError ? (
            <div className={styles.empty}>
              <div>{error?.message || 'Couldn\'t load your people.'}</div>
              <button className={styles.textBtn} onClick={() => refetch()}>Try again</button>
            </div>
          ) : people.length === 0 ? (
            !adding && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon} aria-hidden="true">🤝</div>
                <div className={styles.emptyTitle}>Keep track of who owes who</div>
                <div>Add someone to {ledger?.name ?? 'this ledger'}, then record money you lend, borrow, or split a bill with.</div>
                <button className={styles.primaryBtn} onClick={() => setAdding(true)}>Add your first person</button>
              </div>
            )
          ) : (
            <ul className={styles.people}>
              {people.map(p => <PersonRow key={p.id} person={p} />)}
            </ul>
          )}
        </section>
      </div>

      {ledgerId && <Fab label="New entry" onClick={() => setEntryOpen(true)} />}

      {entryOpen && (
        <EntrySheet
          people={people}
          ledgerId={ledgerId}
          onClose={() => setEntryOpen(false)}
          onSaved={({ shareNotAdded }) => {
            if (shareNotAdded) setNotice('Saved. Your share couldn\'t be added to your expenses, so add it there by hand.');
          }}
        />
      )}
    </div>
  );
};

export default PeoplePage;
