import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../auth/useAuth.js';
import { formatShortDate } from '../../shared/dates.js';
import { cx } from '../../shared/cx.js';
import { useInvitePreview, useClaimInvite } from './queries.js';
import skeleton from '../../shared/Skeleton.module.css';
import page from '../../shared/Page.module.css';
import sheet from '../../shared/form/SheetForm.module.css';
import ledgerStyles from '../ledger/Ledger.module.css';
import styles from './Groups.module.css';

// Landing page for a member invite. Works signed out (to explain it and send you to log in,
// then back here) and signed in (to pick which member you are and join).
const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError, error } = useInvitePreview(token);
  const claim = useClaimInvite();
  const [selected, setSelected] = useState(null);
  const [claimError, setClaimError] = useState('');

  const back = { from: `/invite/${token}` };
  const free = data?.members.filter(m => !m.claimed) ?? [];
  const chosen = data?.members.find(m => m.ref === selected);

  const join = async () => {
    setClaimError('');
    try {
      const { groupId } = await claim.mutateAsync({ token, memberRef: selected });
      navigate(`/groups/shared/${groupId}`, { replace: true });
    } catch (err) {
      setClaimError(err.message || 'Couldn\'t join. Try again.');
    }
  };

  return (
    <div className={page.root}>
      <div className={cx(page.app, styles.sharedApp)}>
        {isLoading ? (
          <div className={cx(skeleton.block, ledgerStyles.balanceSkeleton)} />
        ) : isError ? (
          <section className={ledgerStyles.card}>
            <div className={ledgerStyles.empty}>
              <div className={ledgerStyles.emptyIcon} aria-hidden="true">✉️</div>
              <div className={ledgerStyles.emptyTitle}>This invite isn't available</div>
              <div>{error?.message || 'It may have expired or been turned off. Ask for a new link.'}</div>
              {isAuthenticated && <Link className={ledgerStyles.textBtn} to="/groups">Go to your groups</Link>}
            </div>
          </section>
        ) : (
          <>
            <section className={ledgerStyles.summary} aria-labelledby="invite-heading">
              <div className={ledgerStyles.summaryLabel}>{data.invitedBy} invited you to see</div>
              <h1 id="invite-heading" className={ledgerStyles.summaryAmount}>
                <span aria-hidden="true">{data.emoji || '👥'}</span> {data.groupName}
              </h1>
              <div className={ledgerStyles.summaryMeta}>
                Read-only: you'll see balances, who pays whom and the history. Link expires {formatShortDate(String(data.expiresAt).slice(0, 10))}.
              </div>
            </section>

            {!isAuthenticated ? (
              <section className={ledgerStyles.card}>
                <div className={styles.shareIntro}>
                  <p>Log in or create a free account to join. You'll come straight back here.</p>
                  <div className={styles.inviteActions}>
                    <Link className={ledgerStyles.primaryBtn} to="/login" state={back}>Log in</Link>
                    <Link className={ledgerStyles.textBtn} to="/register" state={back}>Create an account</Link>
                  </div>
                </div>
              </section>
            ) : (
              <section className={ledgerStyles.card} aria-labelledby="who-heading">
                <div className={ledgerStyles.cardHeader}>
                  <h2 id="who-heading" className={ledgerStyles.cardTitle}>Who are you in this group?</h2>
                </div>
                {free.length === 0 ? (
                  <div className={ledgerStyles.empty}>
                    <div>Everyone in this group has already joined. Ask {data.invitedBy} to add you as a member.</div>
                  </div>
                ) : (
                  <div className={styles.shareIntro}>
                    <div className={sheet.chips} role="radiogroup" aria-labelledby="who-heading">
                      {data.members.map(m => (
                        <button
                          key={m.ref}
                          type="button"
                          role="radio"
                          aria-checked={selected === m.ref}
                          className={cx(sheet.chip, selected === m.ref && sheet.selected)}
                          onClick={() => setSelected(m.ref)}
                          disabled={m.claimed || claim.isPending}
                        >
                          {m.name}{m.claimed && <span className={styles.chipTag}>taken</span>}
                        </button>
                      ))}
                    </div>
                    <button className={ledgerStyles.primaryBtn} onClick={join} disabled={!selected || claim.isPending}>
                      {claim.isPending ? 'Joining…' : chosen ? `Join as ${chosen.name}` : 'Pick your name'}
                    </button>
                    {claimError && <div className={ledgerStyles.inlineError} role="alert">{claimError}</div>}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
