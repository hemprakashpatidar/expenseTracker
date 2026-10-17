import { useEffect } from 'react';
import { useParams } from 'react-router';
import { cx } from '../../shared/cx.js';
import { useSharedGroup } from './queries.js';
import GroupReadOnlyView from './GroupReadOnlyView.jsx';
import skeleton from '../../shared/Skeleton.module.css';
import page from '../../shared/Page.module.css';
import ledgerStyles from '../ledger/Ledger.module.css';
import styles from './Groups.module.css';

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
          <GroupReadOnlyView data={data} subtitle={`Shared by ${data.sharedBy} · read-only`} />
        )}

        <footer className={styles.sharedFooter}>
          A read-only view from Expense Tracker. Only the person who shared it can make changes.
        </footer>
      </div>
    </div>
  );
};

export default SharedGroupPage;
