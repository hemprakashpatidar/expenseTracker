import { useState } from 'react';
import { shareUrl } from '../../api/shared.js';
import { useShareLink, useCreateShareLink, useRevokeShareLink } from './queries.js';
import ledgerStyles from '../ledger/Ledger.module.css';
import styles from './Groups.module.css';

// Owner's controls for the group's read-only link
const ShareLinkCard = ({ group }) => {
  const { data: link, isLoading } = useShareLink(group.id);
  const createLink = useCreateShareLink();
  const revokeLink = useRevokeShareLink();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(null); // 'new' | 'off' | null
  const [error, setError] = useState('');

  const url = link?.token ? shareUrl(link.token) : '';
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const busy = createLink.isPending || revokeLink.isPending;

  const run = async (action) => {
    setError('');
    setConfirming(null);
    try {
      await action();
    } catch (err) {
      setError(err.message || 'Couldn\'t update the link. Try again.');
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

  const share = () => navigator.share({ title: `${group.name} balances`, url }).catch(() => {});

  return (
    <section className={ledgerStyles.card} aria-labelledby="share-heading">
      <div className={ledgerStyles.cardHeader}>
        <h2 id="share-heading" className={ledgerStyles.cardTitle}>Share view link</h2>
        {link?.active && <span className={styles.liveTag}>On</span>}
      </div>

      {isLoading ? (
        <div className={styles.hint}>Checking…</div>
      ) : !link?.active ? (
        <div className={styles.shareIntro}>
          <p>
            Anyone with the link can see this group's members, balances, who pays whom, and the
            expense history. They can't change anything, and they don't need an account.
          </p>
          <button className={ledgerStyles.primaryBtn} onClick={() => run(() => createLink.mutateAsync(group.id))} disabled={busy}>
            {createLink.isPending ? 'Creating…' : 'Create link'}
          </button>
        </div>
      ) : (
        <div className={styles.shareActive}>
          {link.needsNewLink ? (
            <p className={styles.hint}>This link still works, but it can't be shown here any more. Make a new link to copy one.</p>
          ) : (
            <div className={styles.linkRow}>
              <input
                className={styles.linkInput}
                value={url}
                readOnly
                aria-label="Share link"
                onFocus={e => e.target.select()}
              />
              <button className={ledgerStyles.primaryBtn} onClick={copy} disabled={busy}>
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          )}

          {confirming ? (
            <div className={ledgerStyles.activityActions}>
              <span className={ledgerStyles.confirmText}>
                {confirming === 'new'
                  ? 'The current link will stop working. Make a new one?'
                  : 'Anyone with the link will lose access. Turn it off?'}
              </span>
              <button className={ledgerStyles.textBtn} onClick={() => setConfirming(null)}>Cancel</button>
              <button
                className={ledgerStyles.dangerBtn}
                onClick={() => run(() => (confirming === 'new' ? createLink : revokeLink).mutateAsync(group.id))}
                disabled={busy}
              >
                {confirming === 'new' ? 'Make new link' : 'Turn off'}
              </button>
            </div>
          ) : (
            <div className={ledgerStyles.manage}>
              {canShare && !link.needsNewLink && (
                <button className={ledgerStyles.textBtn} onClick={share}>Share…</button>
              )}
              <button className={ledgerStyles.textBtn} onClick={() => setConfirming('new')} disabled={busy}>New link</button>
              <button className={ledgerStyles.textBtn} onClick={() => setConfirming('off')} disabled={busy}>Turn off</button>
            </div>
          )}
        </div>
      )}

      {error && <div className={ledgerStyles.inlineError} role="alert">{error}</div>}
    </section>
  );
};

export default ShareLinkCard;
