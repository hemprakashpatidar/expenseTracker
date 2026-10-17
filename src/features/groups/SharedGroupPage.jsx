import { useEffect } from 'react';
import { useParams } from 'react-router';
import { formatDayHeading } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import { formatRupees, balanceTone } from '../ledger/balance.js';
import { useSharedGroup } from './queries.js';
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

const position = (net) => {
  if (net > 0) return `is owed ${formatRupees(net)}`;
  if (net < 0) return `owes ${formatRupees(net)}`;
  return 'settled up';
};

// What someone with a share link sees: read-only, no login, no tab bar
const SharedGroupPage = () => {
  const { token } = useParams();
  const { data, isLoading, isError, error } = useSharedGroup(token);

  // Keep a shared link out of search results even if it's posted publicly
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (data?.group) document.title = `${data.group.name} · shared balances`;
  }, [data]);

  const nameOf = (id) => data?.members.find(m => m.id === id)?.name ?? 'Someone';

  return (
    <div className={page.root}>
      <div className={cx(page.app, styles.sharedApp)}>
        {isLoading ? (
          <div className={cx(skeleton.block, ledgerStyles.balanceSkeleton)} />
        ) : isError ? (
          <section className={ledgerStyles.card}>
            <div className={ledgerStyles.empty}>
              <div className={ledgerStyles.emptyIcon} aria-hidden="true">🔗</div>
              <div className={ledgerStyles.emptyTitle}>This link isn't available</div>
              <div>{error?.message || 'It may have been turned off. Ask whoever shared it for a new one.'}</div>
            </div>
          </section>
        ) : (
          <>
            <header className={styles.sharedHeader}>
              <span className={styles.groupEmoji} aria-hidden="true">{data.group.emoji || '👥'}</span>
              <div className={ledgerStyles.personHeading}>
                <h1 className={ledgerStyles.personTitle}>{data.group.name}</h1>
                <span className={ledgerStyles.personLedger}>Shared by {data.sharedBy} · read-only</span>
              </div>
            </header>

            <section className={ledgerStyles.summary} aria-label="Group summary">
              <div className={ledgerStyles.summaryLabel}>Total spent</div>
              <div className={ledgerStyles.summaryAmount}>{formatRupees(data.group.totalSpent)}</div>
              <div className={ledgerStyles.summaryMeta}>
                {data.group.memberCount} members
                {data.group.archived ? ' · archived' : ''}
              </div>
            </section>

            <section className={ledgerStyles.card} aria-labelledby="shared-balances">
              <div className={ledgerStyles.cardHeader}>
                <h2 id="shared-balances" className={ledgerStyles.cardTitle}>Balances</h2>
              </div>
              <ul className={ledgerStyles.people}>
                {data.members.map(m => (
                  <li key={m.id} className={styles.memberRow}>
                    <span className={ledgerStyles.avatar} aria-hidden="true">{m.name[0]?.toUpperCase()}</span>
                    <span className={ledgerStyles.personInfo}><span className={ledgerStyles.personName}>{m.name}</span></span>
                    <span className={cx(ledgerStyles.balance, ledgerStyles[balanceTone(m.net)])}>{position(m.net)}</span>
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
                      <span className={styles.debtText}><strong>{nameOf(d.from)}</strong> pays <strong>{nameOf(d.to)}</strong></span>
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
                              {item.type === 'expense' ? item.description : `${nameOf(item.from)} paid ${nameOf(item.to)}`}
                            </span>
                            <span className={styles.sharedDetail}>
                              {item.type === 'expense'
                                ? `${nameOf(item.paidBy[0]?.memberId)} paid · ${item.shares.map(s => `${nameOf(s.memberId)} ${formatRupees(s.amount)}`).join(' · ')}`
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
        )}

        <footer className={styles.sharedFooter}>
          A read-only view from Expense Tracker. Only the person who shared it can make changes.
        </footer>
      </div>
    </div>
  );
};

export default SharedGroupPage;
