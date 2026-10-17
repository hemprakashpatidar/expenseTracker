import { useState } from 'react';
import { inviteUrl } from '../../api/invites.js';
import { formatShortDate } from '../../shared/dates.js';
import { useInvites, useCreateInvite, useRevokeInvite, useRemoveAccess } from './queries.js';
import ledgerStyles from '../ledger/Ledger.module.css';
import styles from './Groups.module.css';

const shortDate = (value) => formatShortDate(String(value).slice(0, 10));

// Owner's controls for letting members log in and see the group: the invite link and who joined
const InviteMembersCard = ({ group }) => {
  const { data, isLoading } = useInvites(group.id);
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();
  const removeAccess = useRemoveAccess();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(null); // 'new' | 'off' | personId
  const [error, setError] = useState('');

  const invite = data?.invite;
  const url = invite?.token ? inviteUrl(invite.token) : '';
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const busy = createInvite.isPending || revokeInvite.isPending || removeAccess.isPending;

  const run = async (action) => {
    setError('');
    setConfirming(null);
    try {
      await action();
    } catch (err) {
      setError(err.message || 'Couldn\'t update. Try again.');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Couldn\'t copy. Select the link and copy it yourself.');
    }
  };

  const share = () => navigator.share({
    title: `Join ${group.name}`,
    text: `See our ${group.name} balances and who owes whom.`,
    url,
  }).catch(() => {});

  return (
    <section className={ledgerStyles.card} aria-labelledby="invite-heading">
      <div className={ledgerStyles.cardHeader}>
        <h2 id="invite-heading" className={ledgerStyles.cardTitle}>Invite members</h2>
        {invite?.active && <span className={styles.liveTag}>On</span>}
      </div>

      {isLoading ? (
        <div className={styles.hint}>Checking…</div>
      ) : (
        <>
          {!invite?.active && !invite?.expired ? (
            <div className={styles.shareIntro}>
              <p>
                Send one link to the group. Each person logs in, picks which member they are, and sees
                this group from their side, read-only. The link works for 14 days.
              </p>
              <button className={ledgerStyles.primaryBtn} onClick={() => run(() => createInvite.mutateAsync(group.id))} disabled={busy}>
                {createInvite.isPending ? 'Creating…' : 'Create invite link'}
              </button>
            </div>
          ) : invite.expired ? (
            <div className={styles.shareIntro}>
              <p>The invite link expired on {shortDate(invite.expiresAt)}. People who joined still have access.</p>
              <button className={ledgerStyles.primaryBtn} onClick={() => run(() => createInvite.mutateAsync(group.id))} disabled={busy}>
                Make a new link
              </button>
            </div>
          ) : (
            <div className={styles.shareActive}>
              {invite.needsNewLink ? (
                <p className={styles.hint}>This link still works, but it can't be shown here any more. Make a new link to copy one.</p>
              ) : (
                <div className={styles.linkRow}>
                  <input className={styles.linkInput} value={url} readOnly aria-label="Invite link" onFocus={e => e.target.select()} />
                  <button className={ledgerStyles.primaryBtn} onClick={copy} disabled={busy}>{copied ? 'Copied ✓' : 'Copy'}</button>
                </div>
              )}
              <div className={styles.hint}>Works until {shortDate(invite.expiresAt)}.</div>

              {confirming === 'new' || confirming === 'off' ? (
                <div className={ledgerStyles.activityActions}>
                  <span className={ledgerStyles.confirmText}>
                    {confirming === 'new'
                      ? 'The current link will stop working. People who joined keep access.'
                      : 'Nobody new can join with this link. People who joined keep access.'}
                  </span>
                  <button className={ledgerStyles.textBtn} onClick={() => setConfirming(null)}>Cancel</button>
                  <button
                    className={ledgerStyles.dangerBtn}
                    onClick={() => run(() => (confirming === 'new' ? createInvite : revokeInvite).mutateAsync(group.id))}
                    disabled={busy}
                  >
                    {confirming === 'new' ? 'Make new link' : 'Turn off'}
                  </button>
                </div>
              ) : (
                <div className={ledgerStyles.manage}>
                  {canShare && !invite.needsNewLink && <button className={ledgerStyles.textBtn} onClick={share}>Share…</button>}
                  <button className={ledgerStyles.textBtn} onClick={() => setConfirming('new')} disabled={busy}>New link</button>
                  <button className={ledgerStyles.textBtn} onClick={() => setConfirming('off')} disabled={busy}>Turn off</button>
                </div>
              )}
            </div>
          )}

          {data?.members?.length > 0 && (
            <ul className={ledgerStyles.people} aria-label="Who has joined">
              {data.members.map(m => (
                <li key={m.personId} className={styles.accessRow}>
                  <span className={ledgerStyles.personInfo}>
                    <span className={ledgerStyles.personName}>{m.name}</span>
                    <span className={ledgerStyles.personMeta}>
                      {m.claimedBy ? `Joined as @${m.claimedBy.userName} · ${shortDate(m.claimedBy.joinedAt)}` : 'Not joined yet'}
                    </span>
                  </span>
                  {m.claimedBy && (confirming === m.personId ? (
                    <span className={styles.accessConfirm}>
                      <button className={ledgerStyles.textBtn} onClick={() => setConfirming(null)}>Keep</button>
                      <button
                        className={ledgerStyles.dangerBtn}
                        onClick={() => run(() => removeAccess.mutateAsync({ groupId: group.id, personId: m.personId }))}
                        disabled={busy}
                      >
                        Remove
                      </button>
                    </span>
                  ) : (
                    <button className={ledgerStyles.textBtn} onClick={() => setConfirming(m.personId)}>Remove access</button>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error && <div className={ledgerStyles.inlineError} role="alert">{error}</div>}
    </section>
  );
};

export default InviteMembersCard;
