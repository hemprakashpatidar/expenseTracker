import { useEffect, useRef, useState } from 'react';
import { cx } from '../../shared/cx.js';
import { formatRupees } from './balance.js';
import { useCreateLedger, useUpdateLedger } from './queries.js';
import styles from './LedgerSwitcher.module.css';

const net = (ledger) => ledger.totals.owedToYou - ledger.totals.youOwe;

const NetBadge = ({ ledger }) => {
  const value = net(ledger);
  if (value === 0) return <span className={styles.netSettled}>settled</span>;
  return (
    <span className={value > 0 ? styles.netOwed : styles.netOwe}>
      {value > 0 ? '+' : '−'}{formatRupees(value)}
    </span>
  );
};

// One-line form inside the menu, used for "New ledger" and "Rename"
const NameForm = ({ initial = '', submitLabel, pending, error, onSubmit, onCancel }) => {
  const [name, setName] = useState(initial);
  return (
    <form
      className={styles.nameForm}
      onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); }}
    >
      <input
        className={styles.nameInput}
        aria-label="Ledger name"
        placeholder="Business"
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={pending}
        autoFocus
      />
      <div className={styles.nameActions}>
        <button type="button" className={styles.textBtn} onClick={onCancel}>Cancel</button>
        <button type="submit" className={styles.saveBtn} disabled={pending || !name.trim()}>{submitLabel}</button>
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}
    </form>
  );
};

// "Personal ▾" under the page title: switch ledgers, add one, rename or archive the current one
const LedgerSwitcher = ({ ledgers, current, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'create' | 'rename' | null
  const [error, setError] = useState('');
  const wrapRef = useRef(null);
  const createLedger = useCreateLedger();
  const updateLedger = useUpdateLedger();

  const close = () => { setOpen(false); setMode(null); setError(''); };

  // Close on an outside click or Escape
  useEffect(() => {
    if (!open) return undefined;
    const dismiss = () => { setOpen(false); setMode(null); setError(''); };
    const onPointerDown = (e) => { if (!wrapRef.current?.contains(e.target)) dismiss(); };
    const onKeyDown = (e) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!current) return <div className={styles.placeholder} aria-hidden="true" />;

  // The server enforces the same rules; this just explains them up front
  const settled = current.totals.owedToYou === 0 && current.totals.youOwe === 0;
  const canArchive = ledgers.length > 1 && settled;
  const archiveHint = ledgers.length <= 1
    ? 'You need at least one ledger'
    : 'Settle up with everyone in it first';

  const run = async (action) => {
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message || 'Couldn\'t save. Try again.');
    }
  };

  const handleCreate = (name) => run(async () => {
    const ledger = await createLedger.mutateAsync(name);
    onSelect(ledger.id);
    close();
  });

  const handleRename = (name) => run(async () => {
    await updateLedger.mutateAsync({ id: current.id, changes: { name } });
    close();
  });

  const handleArchive = () => run(async () => {
    await updateLedger.mutateAsync({ id: current.id, changes: { archived: true } });
    onSelect(ledgers.find(l => l.id !== current.id).id);
    close();
  });

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        className={styles.trigger}
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Ledger: ${current.name}. Change ledger`}
      >
        <span className={styles.triggerName}>{current.name}</span>
        <span className={styles.caret} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className={styles.menu} role="menu" aria-label="Ledgers">
          {/* 1. Switch ledger */}
          <div className={styles.ledgerList} role="group" aria-label="Switch ledger">
            {ledgers.map(ledger => {
              const active = ledger.id === current.id;
              return (
                <button
                  key={ledger.id}
                  role="menuitemradio"
                  aria-checked={active}
                  className={cx(styles.ledgerCard, active && styles.ledgerCardActive)}
                  onClick={() => { onSelect(ledger.id); close(); }}
                >
                  <span className={styles.ledgerText}>
                    <span className={styles.ledgerName}>{ledger.name}</span>
                    <span className={styles.ledgerMeta}>
                      {ledger.peopleCount} {ledger.peopleCount === 1 ? 'person' : 'people'}
                    </span>
                  </span>
                  <NetBadge ledger={ledger} />
                  <span className={styles.check} aria-hidden="true">{active ? '✓' : ''}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.divider} role="separator" />

          {/* 2. Primary action */}
          {mode === 'create' ? (
            <NameForm submitLabel="Create" pending={createLedger.isPending} error={error}
              onSubmit={handleCreate} onCancel={() => { setMode(null); setError(''); }} />
          ) : (
            <button role="menuitem" className={styles.newLedger} onClick={() => { setMode('create'); setError(''); }}>
              <span className={styles.newIcon} aria-hidden="true">＋</span>
              New ledger
            </button>
          )}

          <div className={styles.divider} role="separator" />

          {/* 3. Manage the current ledger */}
          <div className={styles.manageGroup} role="group" aria-labelledby="ledger-manage-label">
            <div className={styles.groupLabel} id="ledger-manage-label">Manage “{current.name}”</div>
            {mode === 'rename' ? (
              <NameForm initial={current.name} submitLabel="Save" pending={updateLedger.isPending} error={error}
                onSubmit={handleRename} onCancel={() => { setMode(null); setError(''); }} />
            ) : (
              <>
                <button role="menuitem" className={styles.manageItem} onClick={() => { setMode('rename'); setError(''); }}>
                  <span className={styles.manageIcon} aria-hidden="true">✏️</span>
                  <span className={styles.manageText}>Rename</span>
                </button>

                <button
                  role="menuitem"
                  className={cx(styles.manageItem, canArchive ? styles.danger : styles.restricted)}
                  onClick={handleArchive}
                  disabled={!canArchive || updateLedger.isPending}
                  aria-describedby={canArchive ? undefined : 'ledger-archive-hint'}
                >
                  <span className={styles.manageIcon} aria-hidden="true">{canArchive ? '🗄️' : '⚠️'}</span>
                  <span className={styles.manageText}>
                    Archive
                    {!canArchive && <span className={styles.helper} id="ledger-archive-hint">{archiveHint}</span>}
                  </span>
                </button>
                {error && <div className={styles.error} role="alert">{error}</div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerSwitcher;
