import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { cx } from '../../shared/cx.js';
import { useLeaveSharedGroup, useSharedWithMeGroup } from './queries.js';
import { positionHeading } from './format.js';
import GroupReadOnlyView from './GroupReadOnlyView.jsx';
import skeleton from '../../shared/Skeleton.module.css';
import page from '../../shared/Page.module.css';
import ledgerStyles from '../ledger/Ledger.module.css';

// A group someone invited you to: read-only, from your point of view
const SharedWithMePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useSharedWithMeGroup(id);
  const leave = useLeaveSharedGroup();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const handleLeave = async () => {
    setError('');
    try {
      await leave.mutateAsync(id);
      navigate('/groups', { replace: true });
    } catch (err) {
      setError(err.message || 'Couldn\'t leave. Try again.');
    }
  };

  return (
    <div className={page.root}>
      <div className={page.app}>
        <div className={ledgerStyles.personHeader}>
          <Link to="/groups" className={ledgerStyles.back} aria-label="Back to groups">‹</Link>
        </div>

        {isLoading ? (
          <div className={cx(skeleton.block, ledgerStyles.balanceSkeleton)} />
        ) : isError ? (
          <section className={ledgerStyles.card}>
            <div className={ledgerStyles.empty}>
              <div className={ledgerStyles.emptyTitle}>You don't have access to this group</div>
              <div>It may have been removed, or the person who shared it took away your access.</div>
            </div>
          </section>
        ) : (
          <>
            <GroupReadOnlyView
              data={data}
              subtitle={`Shared by ${data.sharedBy} · you're ${data.joinedAs}`}
              summary={(
                <section className={ledgerStyles.summary} aria-label="Your balance in this group">
                  <div className={ledgerStyles.summaryLabel}>In this group</div>
                  <div className={ledgerStyles.summaryAmount}>{positionHeading(data.myNet)}</div>
                  <div className={ledgerStyles.summaryMeta}>
                    Only {data.sharedBy} can add or change expenses. Settle up with them directly.
                  </div>
                </section>
              )}
            />

            <section className={ledgerStyles.manage}>
              {confirming ? (
                <div className={ledgerStyles.activityActions}>
                  <span className={ledgerStyles.confirmText}>You'll stop seeing this group. {data.sharedBy}'s records stay as they are.</span>
                  <button className={ledgerStyles.textBtn} onClick={() => setConfirming(false)}>Cancel</button>
                  <button className={ledgerStyles.dangerBtn} onClick={handleLeave} disabled={leave.isPending}>
                    {leave.isPending ? 'Leaving…' : 'Leave group'}
                  </button>
                </div>
              ) : (
                <button className={ledgerStyles.textBtn} onClick={() => setConfirming(true)}>Leave group</button>
              )}
              {error && <div className={ledgerStyles.inlineError} role="alert">{error}</div>}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedWithMePage;
