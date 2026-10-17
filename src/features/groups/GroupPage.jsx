import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { formatDayHeading } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import Fab from '../../shared/Fab.jsx';
import { formatRupees, balanceTone } from '../ledger/balance.js';
import { useAllPeople, useGroup, useDeleteGroupExpense, useDeleteGroupSettlement, useUpdateGroup } from './queries.js';
import { positionHeading, memberPosition } from './format.js';
import GroupExpenseSheet from './GroupExpenseSheet.jsx';
import GroupSettleSheet from './GroupSettleSheet.jsx';
import skeleton from '../../shared/Skeleton.module.css';
import page from '../../shared/Page.module.css';
import ledgerStyles from '../ledger/Ledger.module.css';
import styles from './Groups.module.css';

const groupByDate = (items) => items.reduce((groups, item) => {
  const last = groups[groups.length - 1];
  if (last && last.date === item.date) last.items.push(item);
  else groups.push({ date: item.date, items: [item] });
  return groups;
}, []);

const ActivityRow = ({ item, nameOf, expanded, onToggle, onDelete, deleting }) => {
  const [confirming, setConfirming] = useState(false);
  const isExpense = item.type === 'expense';
  const payer = isExpense ? item.paidBy[0]?.personId : null;
  const title = isExpense ? item.description : `${nameOf(item.from)} paid ${nameOf(item.to, { object: true })}`;
  const detail = isExpense
    ? `${nameOf(payer)} paid ${formatRupees(item.amount)}${item.myShare > 0 ? ` · your share ${formatRupees(item.myShare)}` : ' · you\'re not in it'}${item.addedToExpenses ? ' · in your expenses' : ''}`
    : [formatRupees(item.amount), item.note].filter(Boolean).join(' · ');
  const effect = isExpense ? item.myEffect : 0;

  return (
    <li className={cx(ledgerStyles.activity, expanded && ledgerStyles.activityOpen)}>
      <button className={ledgerStyles.activityMain} onClick={() => { setConfirming(false); onToggle(); }} aria-expanded={expanded}>
        <span className={ledgerStyles.activityIcon} aria-hidden="true">{isExpense ? '🧾' : '✅'}</span>
        <span className={ledgerStyles.personInfo}>
          <span className={ledgerStyles.personName}>{title}</span>
          <span className={ledgerStyles.personMeta}>{detail}</span>
        </span>
        {isExpense && effect !== 0 && (
          <span className={cx(ledgerStyles.effect, ledgerStyles[effect > 0 ? 'owed' : 'owe'])}>
            {effect > 0 ? '+' : '−'}{formatRupees(effect)}
          </span>
        )}
      </button>

      {expanded && (
        <div className={ledgerStyles.activityActions}>
          {isExpense && (
            <span className={styles.shareList}>
              {item.shares.filter(s => s.amount > 0).map(s => `${nameOf(s.personId)} ${formatRupees(s.amount)}`).join(' · ')}
            </span>
          )}
          {confirming ? (
            <>
              <span className={ledgerStyles.confirmText}>
                {isExpense && item.addedToExpenses ? 'Delete this and the matching expense?' : 'Delete this?'}
              </span>
              <button className={ledgerStyles.textBtn} onClick={() => setConfirming(false)}>Keep</button>
              <button className={ledgerStyles.dangerBtn} onClick={onDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          ) : (
            <button className={ledgerStyles.textBtn} onClick={() => setConfirming(true)}>
              <span aria-hidden="true">🗑</span> Delete
            </button>
          )}
        </div>
      )}
    </li>
  );
};

// Rename, simplify switch, and adding members (from any ledger, or new names)
const GroupSettings = ({ group, members, onNotice }) => {
  const updateGroup = useUpdateGroup();
  const { data: peopleData } = useAllPeople();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group.name);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const memberIds = new Set(members.map(m => m.id));
  const candidates = (peopleData?.people ?? []).filter(p => !memberIds.has(p.id));

  const save = async (changes, after) => {
    try {
      await updateGroup.mutateAsync({ id: group.id, changes });
      after?.();
    } catch (err) {
      onNotice(err.message || 'Couldn\'t save. Try again.');
    }
  };

  return (
    <section className={ledgerStyles.card} aria-labelledby="group-settings-heading">
      <div className={ledgerStyles.cardHeader}>
        <h2 id="group-settings-heading" className={ledgerStyles.cardTitle}>Settings</h2>
      </div>

      <label className={cx(ledgerStyles.toggleRow, group.simplifyDebts && ledgerStyles.toggleOn)}>
        <input
          type="checkbox"
          checked={group.simplifyDebts}
          onChange={e => save({ simplifyDebts: e.target.checked })}
          disabled={updateGroup.isPending}
        />
        <span>
          Simplify debts
          <span className={ledgerStyles.toggleHint}>
            {group.simplifyDebts
              ? 'On: the fewest payments settle the group. Balances on People follow these.'
              : 'Off: whoever was in an expense owes whoever paid it.'}
          </span>
        </span>
      </label>

      {renaming ? (
        <form className={ledgerStyles.addPerson} onSubmit={e => { e.preventDefault(); if (name.trim()) save({ name: name.trim() }, () => setRenaming(false)); }}>
          <input className={ledgerStyles.addPersonInput} aria-label="Group name" value={name} onChange={e => setName(e.target.value)} autoFocus />
          <button type="submit" className={ledgerStyles.primaryBtn} disabled={updateGroup.isPending}>Save</button>
          <button type="button" className={ledgerStyles.textBtn} onClick={() => { setRenaming(false); setName(group.name); }}>Cancel</button>
        </form>
      ) : adding ? (
        <div className={styles.addMembers}>
          {candidates.length > 0 && (
            <div className={styles.candidateChips}>
              {candidates.map(p => (
                <button key={p.id} className={styles.candidate} onClick={() => save({ memberIds: [p.id] })} disabled={updateGroup.isPending}>
                  <span aria-hidden="true">＋</span> {p.name}
                </button>
              ))}
            </div>
          )}
          <form className={ledgerStyles.addPerson} onSubmit={e => { e.preventDefault(); if (newName.trim()) save({ newMemberNames: [newName.trim()] }, () => setNewName('')); }}>
            <input className={ledgerStyles.addPersonInput} aria-label="New person's name" placeholder="Someone new" value={newName} onChange={e => setNewName(e.target.value)} />
            <button type="submit" className={ledgerStyles.primaryBtn} disabled={updateGroup.isPending || !newName.trim()}>Add</button>
            <button type="button" className={ledgerStyles.textBtn} onClick={() => setAdding(false)}>Done</button>
          </form>
        </div>
      ) : (
        <div className={ledgerStyles.manage}>
          <button className={ledgerStyles.textBtn} onClick={() => setRenaming(true)}>Rename</button>
          <button className={ledgerStyles.textBtn} onClick={() => setAdding(true)}>Add people</button>
        </div>
      )}
    </section>
  );
};

const GroupPage = () => {
  const { id } = useParams();
  const { data, isLoading, isError, error, refetch } = useGroup(id);
  const deleteExpense = useDeleteGroupExpense();
  const deleteSettlement = useDeleteGroupSettlement();
  const [sheet, setSheet] = useState(null); // { type: 'expense' } | { type: 'settle', preset }
  const [expandedId, setExpandedId] = useState(null);
  const [notice, setNotice] = useState('');

  const group = data?.group;
  const members = data?.members ?? [];
  const nameOf = (personId, { object = false } = {}) => {
    const member = members.find(m => m.id === personId);
    if (!member) return 'Someone';
    return member.isSelf && object ? 'you' : member.name;
  };

  const handleDelete = async (item) => {
    try {
      if (item.type === 'expense') {
        const result = await deleteExpense.mutateAsync({ groupId: group.id, expenseId: item.id });
        if (result.myShareRemoved === false) setNotice('Deleted. The matching expense couldn\'t be removed, so delete it on the Expenses tab.');
      } else {
        await deleteSettlement.mutateAsync({ groupId: group.id, settlementId: item.id });
      }
      setExpandedId(null);
    } catch (err) {
      setNotice(err.message || 'Couldn\'t delete. Try again.');
    }
  };

  const myNet = group?.myNet ?? 0;
  const selfId = members.find(m => m.isSelf)?.id;
  // Settle up starts from your own suggested payment, if there is one
  const myDebts = (data?.debts ?? []).filter(d => d.from === selfId || d.to === selfId);

  return (
    <div className={page.root}>
      <div className={page.app}>
        <header className={ledgerStyles.personHeader}>
          <Link to="/groups" className={ledgerStyles.back} aria-label="Back to groups">‹</Link>
          <div className={ledgerStyles.personHeading}>
            <h1 className={ledgerStyles.personTitle}>
              {group ? <><span aria-hidden="true">{group.emoji || '👥'}</span> {group.name}</> : ' '}
            </h1>
            {group && <span className={ledgerStyles.personLedger}>{group.memberCount} members · {formatRupees(group.totalSpent)} spent</span>}
          </div>
        </header>

        {isLoading ? (
          <div className={cx(skeleton.block, ledgerStyles.balanceSkeleton)} />
        ) : isError ? (
          <section className={ledgerStyles.card}>
            <div className={ledgerStyles.empty}>
              <div>{error?.message || 'Couldn\'t load this group.'}</div>
              <button className={ledgerStyles.textBtn} onClick={() => refetch()}>Try again</button>
            </div>
          </section>
        ) : (
          <>
            <section className={ledgerStyles.summary} aria-label="Your balance in this group">
              <div className={ledgerStyles.summaryLabel}>In this group</div>
              <div className={ledgerStyles.summaryAmount}>
                {positionHeading(myNet)}
              </div>
              <div className={ledgerStyles.summaryActions}>
                <button className={ledgerStyles.heroBtn} onClick={() => setSheet({ type: 'expense' })}>Add expense</button>
                <button
                  className={cx(ledgerStyles.heroBtn, ledgerStyles.heroBtnGhost)}
                  onClick={() => setSheet({ type: 'settle', preset: myDebts[0] })}
                >
                  Settle up
                </button>
              </div>
            </section>

            {notice && (
              <div className={ledgerStyles.notice} role="status">
                {notice}
                <button className={ledgerStyles.textBtn} onClick={() => setNotice('')}>Dismiss</button>
              </div>
            )}

            <section className={ledgerStyles.card} aria-labelledby="balances-heading">
              <div className={ledgerStyles.cardHeader}>
                <h2 id="balances-heading" className={ledgerStyles.cardTitle}>Balances</h2>
              </div>
              <ul className={ledgerStyles.people}>
                {members.map(m => (
                  <li key={m.id} className={styles.memberRow}>
                    <span className={ledgerStyles.avatar} aria-hidden="true">{m.isSelf ? '★' : m.name[0]?.toUpperCase()}</span>
                    <span className={ledgerStyles.personInfo}>
                      <span className={ledgerStyles.personName}>{m.name}</span>
                      {!m.isSelf && m.ledger && <span className={ledgerStyles.personMeta}>{m.ledger.name}</span>}
                    </span>
                    <span className={cx(ledgerStyles.balance, ledgerStyles[balanceTone(m.net)])}>{memberPosition(m)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={ledgerStyles.card} aria-labelledby="debts-heading">
              <div className={ledgerStyles.cardHeader}>
                <h2 id="debts-heading" className={ledgerStyles.cardTitle}>Who pays whom</h2>
                <span className={styles.modeTag}>{group.simplifyDebts ? 'Simplified' : 'By expense'}</span>
              </div>
              {data.debts.length === 0 ? (
                <div className={ledgerStyles.empty}><div>Everyone's settled up.</div></div>
              ) : (
                <ul className={ledgerStyles.people}>
                  {data.debts.map(d => (
                    <li key={`${d.from}-${d.to}`} className={styles.debtRow}>
                      <span className={styles.debtText}>
                        <strong>{nameOf(d.from)}</strong> {nameOf(d.from) === 'You' ? 'pay' : 'pays'} <strong>{nameOf(d.to, { object: true })}</strong>
                      </span>
                      <span className={styles.debtAmount}>{formatRupees(d.amount)}</span>
                      <button className={styles.recordBtn} onClick={() => setSheet({ type: 'settle', preset: d })}>Record</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={ledgerStyles.card} aria-labelledby="group-activity-heading">
              <div className={ledgerStyles.cardHeader}>
                <h2 id="group-activity-heading" className={ledgerStyles.cardTitle}>Activity</h2>
              </div>
              {data.activity.length === 0 ? (
                <div className={ledgerStyles.empty}><div>No expenses yet. Tap Add expense to record the first one.</div></div>
              ) : (
                groupByDate(data.activity).map(day => (
                  <div key={day.date} className={ledgerStyles.day}>
                    <div className={ledgerStyles.dayHeading}>{formatDayHeading(day.date)}</div>
                    <ul className={ledgerStyles.activities}>
                      {day.items.map(item => (
                        <ActivityRow
                          key={`${item.type}-${item.id}`}
                          item={item}
                          nameOf={nameOf}
                          expanded={expandedId === item.id}
                          onToggle={() => setExpandedId(current => (current === item.id ? null : item.id))}
                          onDelete={() => handleDelete(item)}
                          deleting={deleteExpense.isPending || deleteSettlement.isPending}
                        />
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>

            <GroupSettings key={group.id + group.name} group={group} members={members} onNotice={setNotice} />
          </>
        )}
      </div>

      {group && <Fab label={`Add an expense to ${group.name}`} onClick={() => setSheet({ type: 'expense' })} />}

      {sheet?.type === 'expense' && (
        <GroupExpenseSheet
          group={group}
          members={members}
          onClose={() => setSheet(null)}
          onSaved={({ shareNotAdded }) => {
            if (shareNotAdded) setNotice('Saved. Your share couldn\'t be added to your expenses, so add it there by hand.');
          }}
        />
      )}
      {sheet?.type === 'settle' && (
        <GroupSettleSheet group={group} members={members} preset={sheet.preset} onClose={() => setSheet(null)} />
      )}
    </div>
  );
};

export default GroupPage;
