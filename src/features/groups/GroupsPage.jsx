import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/useAuth.js';
import { getAuthData } from '../auth/session.js';
import AppHeader from '../../shared/AppHeader.jsx';
import Fab from '../../shared/Fab.jsx';
import { formatShortDate } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import { formatRupees, balanceTone } from '../ledger/balance.js';
import { groupPosition } from './format.js';
import { useGroups } from './queries.js';
import NewGroupSheet from './NewGroupSheet.jsx';
import skeleton from '../../shared/Skeleton.module.css';
import page from '../../shared/Page.module.css';
import ledgerStyles from '../ledger/Ledger.module.css';
import styles from './Groups.module.css';

const GroupCard = ({ group }) => (
  <li>
    <Link to={`/groups/${group.id}`} className={styles.groupCard}>
      <span className={styles.groupEmoji} aria-hidden="true">{group.emoji || '👥'}</span>
      <span className={ledgerStyles.personInfo}>
        <span className={ledgerStyles.personName}>{group.name}</span>
        <span className={ledgerStyles.personMeta}>
          {group.memberCount} members · {formatRupees(group.totalSpent)} spent
          {group.lastActivityOn ? ` · ${formatShortDate(group.lastActivityOn)}` : ''}
        </span>
      </span>
      <span className={cx(ledgerStyles.balance, ledgerStyles[balanceTone(group.myNet)])}>{groupPosition(group.myNet)}</span>
    </Link>
  </li>
);

const GroupsPage = () => {
  const { logout } = useAuth();
  const currentUser = getAuthData();
  const { data: groups = [], isLoading, isError, error, refetch } = useGroups();
  const [creating, setCreating] = useState(false);

  const owedToYou = groups.reduce((sum, g) => sum + Math.max(g.myNet, 0), 0);
  const youOwe = groups.reduce((sum, g) => sum + Math.max(-g.myNet, 0), 0);
  const net = owedToYou - youOwe;

  return (
    <div className={page.root}>
      <div className={page.app}>
        <AppHeader title="Groups" userName={currentUser?.userName} onLogout={logout} />

        <section className={ledgerStyles.summary} aria-label="Across all groups">
          <div className={ledgerStyles.summaryLabel}>Across your groups</div>
          {isLoading ? (
            <div className={cx(skeleton.block, ledgerStyles.summarySkeleton)} />
          ) : (
            <>
              <div className={ledgerStyles.summaryAmount}>
                {net > 0 ? <>You're owed {formatRupees(net)}</> : net < 0 ? <>You owe {formatRupees(net)}</> : 'All settled up'}
              </div>
              <div className={ledgerStyles.summaryMeta}>
                {formatRupees(owedToYou)} owed to you · {formatRupees(youOwe)} you owe
              </div>
            </>
          )}
        </section>

        <section className={ledgerStyles.card} aria-labelledby="groups-heading">
          <div className={ledgerStyles.cardHeader}>
            <h2 id="groups-heading" className={ledgerStyles.cardTitle}>Your groups</h2>
            <button className={ledgerStyles.textBtn} onClick={() => setCreating(true)}>
              <span aria-hidden="true">＋</span> New group
            </button>
          </div>

          {isLoading ? (
            <div className={ledgerStyles.rowsSkeleton}>
              {[0, 1].map(i => <div key={i} className={cx(skeleton.block, ledgerStyles.rowSkeleton)} />)}
            </div>
          ) : isError ? (
            <div className={ledgerStyles.empty}>
              <div>{error?.message || 'Couldn\'t load your groups.'}</div>
              <button className={ledgerStyles.textBtn} onClick={() => refetch()}>Try again</button>
            </div>
          ) : groups.length === 0 ? (
            <div className={ledgerStyles.empty}>
              <div className={ledgerStyles.emptyIcon} aria-hidden="true">🏖️</div>
              <div className={ledgerStyles.emptyTitle}>Split trips, flats and dinners</div>
              <div>Make a group, add who's in it, and record who paid for what. We'll work out who owes whom.</div>
              <button className={ledgerStyles.primaryBtn} onClick={() => setCreating(true)}>Create a group</button>
            </div>
          ) : (
            <ul className={ledgerStyles.people}>
              {groups.map(g => <GroupCard key={g.id} group={g} />)}
            </ul>
          )}
        </section>
      </div>

      <Fab label="New group" onClick={() => setCreating(true)} />
      {creating && <NewGroupSheet onClose={() => setCreating(false)} />}
    </div>
  );
};

export default GroupsPage;
