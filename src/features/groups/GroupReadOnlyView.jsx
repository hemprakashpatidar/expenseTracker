import { formatDayHeading } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import { formatRupees, balanceTone } from '../ledger/balance.js';
import ledgerStyles from '../ledger/Ledger.module.css';
import styles from './Groups.module.css';

const groupByDate = (items) => items.reduce((groups, item) => {
  const last = groups[groups.length - 1];
  if (last && last.date === item.date) last.items.push(item);
  else groups.push({ date: item.date, items: [item] });
  return groups;
}, []);

// "is owed ₹800" / "owes ₹200" / "settled up"; "you are owed" etc. for the viewer
const position = (member) => {
  if (member.net > 0) return `${member.isYou ? 'are owed' : 'is owed'} ${formatRupees(member.net)}`;
  if (member.net < 0) return `${member.isYou ? 'owe' : 'owes'} ${formatRupees(member.net)}`;
  return 'settled up';
};

// A group as someone outside it sees it (public link, or an invited member): header,
// summary, balances, who pays whom and history, with no editing. `summary` replaces the
// default "Total spent" card.
const GroupReadOnlyView = ({ data, subtitle, summary }) => {
  const nameOf = (id, { object = false } = {}) => {
    const member = data.members.find(m => m.id === id);
    if (!member) return 'Someone';
    return member.isYou && object ? 'you' : member.name;
  };

  return (
    <>
      <header className={styles.sharedHeader}>
        <span className={styles.groupEmoji} aria-hidden="true">{data.group.emoji || '👥'}</span>
        <div className={ledgerStyles.personHeading}>
          <h1 className={ledgerStyles.personTitle}>{data.group.name}</h1>
          <span className={ledgerStyles.personLedger}>{subtitle}</span>
        </div>
      </header>

      {summary ?? (
        <section className={ledgerStyles.summary} aria-label="Group summary">
          <div className={ledgerStyles.summaryLabel}>Total spent</div>
          <div className={ledgerStyles.summaryAmount}>{formatRupees(data.group.totalSpent)}</div>
          <div className={ledgerStyles.summaryMeta}>
            {data.group.memberCount} members
            {data.group.archived ? ' · archived' : ''}
          </div>
        </section>
      )}

      <section className={ledgerStyles.card} aria-labelledby="shared-balances">
        <div className={ledgerStyles.cardHeader}>
          <h2 id="shared-balances" className={ledgerStyles.cardTitle}>Balances</h2>
        </div>
        <ul className={ledgerStyles.people}>
          {data.members.map(m => (
            <li key={m.id} className={styles.memberRow}>
              <span className={ledgerStyles.avatar} aria-hidden="true">{m.isYou ? '★' : m.name[0]?.toUpperCase()}</span>
              <span className={ledgerStyles.personInfo}><span className={ledgerStyles.personName}>{m.name}</span></span>
              <span className={cx(ledgerStyles.balance, ledgerStyles[balanceTone(m.net)])}>{position(m)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={ledgerStyles.card} aria-labelledby="shared-debts">
        <div className={ledgerStyles.cardHeader}>
          <h2 id="shared-debts" className={ledgerStyles.cardTitle}>Who pays whom</h2>
          <span className={styles.modeTag}>{data.group.simplifyDebts ? 'Simplified' : 'By expense'}</span>
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
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={ledgerStyles.card} aria-labelledby="shared-activity">
        <div className={ledgerStyles.cardHeader}>
          <h2 id="shared-activity" className={ledgerStyles.cardTitle}>History</h2>
        </div>
        {data.activity.length === 0 ? (
          <div className={ledgerStyles.empty}><div>No expenses yet.</div></div>
        ) : (
          groupByDate(data.activity).map(day => (
            <div key={day.date} className={ledgerStyles.day}>
              <div className={ledgerStyles.dayHeading}>{formatDayHeading(day.date)}</div>
              <ul className={ledgerStyles.activities}>
                {day.items.map(item => (
                  <li key={item.id} className={styles.sharedActivity}>
                    <span className={ledgerStyles.activityIcon} aria-hidden="true">{item.type === 'expense' ? '🧾' : '✅'}</span>
                    <span className={ledgerStyles.personInfo}>
                      <span className={ledgerStyles.personName}>
                        {item.type === 'expense' ? item.description : `${nameOf(item.from)} paid ${nameOf(item.to, { object: true })}`}
                      </span>
                      <span className={styles.sharedDetail}>
                        {item.type === 'expense'
                          ? `${nameOf(item.paidBy[0]?.memberId)} paid${item.myShare !== undefined ? (item.myShare > 0 ? ` · your share ${formatRupees(item.myShare)}` : ' · you\'re not in it') : ''} · ${item.shares.map(s => `${nameOf(s.memberId)} ${formatRupees(s.amount)}`).join(' · ')}`
                          : item.note || ''}
                      </span>
                    </span>
                    <span className={styles.debtAmount}>{formatRupees(item.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
};

export default GroupReadOnlyView;
