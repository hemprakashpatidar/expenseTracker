import { useRef, useState } from 'react';
import { createTransaction } from '../../api/transactions.js';
import { getCategoryIcon } from '../../shared/categoryStyle.js';
import { CATEGORIES, PAYMENT_METHODS } from '../../shared/constants.js';
import { parseCSV, parsePDFText, extractPDFText } from './parsers.js';
import { cx } from '../../shared/cx.js';
import styles from './ImportTransactions.module.css';

// ── Component ─────────────────────────────────────────────────────────────────

const ImportTransactions = ({ onClose, onImported }) => {
  const fileRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload | review | importing | done
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [rows, setRows] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    // By type as well as name: files shared from Drive or Downloads on Android can arrive
    // without an extension
    const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    const kind = file.type === 'application/pdf' || ext === 'pdf' ? 'pdf'
      : ['text/csv', 'application/vnd.ms-excel', 'text/comma-separated-values'].includes(file.type) || ext === 'csv' ? 'csv'
      : null;
    if (!kind) {
      setParseError('Only CSV and PDF files are supported.');
      return;
    }
    setParsing(true);
    setParseError('');
    try {
      // Read the file first, before any other await: on iOS (seen in Brave) the picked file
      // can be released while the PDF library downloads ("The object can not be found here")
      const contents = kind === 'csv' ? await file.text() : await file.arrayBuffer();
      let parsed = [];
      if (kind === 'csv') {
        parsed = parseCSV(contents);
      } else {
        parsed = parsePDFText(await extractPDFText(contents));
      }
      if (parsed.length === 0) {
        setParseError('Could not detect any transactions. Make sure the file is a bank statement in CSV or PDF format.');
        setParsing(false);
        return;
      }
      setRows(parsed);
      setStep('review');
    } catch (err) {
      console.error(err);
      setParseError(`Couldn't read this file. ${err.message ? `(${err.message})` : 'Try exporting the statement again.'}`);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const updateRow = (i, field, value) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const toggleRow = (i) => updateRow(i, 'selected', !rows[i].selected);
  const toggleAll = () => {
    const allSelected = rows.every(r => r.selected);
    setRows(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  const selectedRows = rows.filter(r => r.selected);

  const handleImport = async () => {
    if (selectedRows.length === 0) return;
    setStep('importing');
    let done = 0, failed = 0;
    setProgress({ done: 0, total: selectedRows.length, failed: 0 });

    for (const row of selectedRows) {
      try {
        await createTransaction({
          expense: row.expense,
          amount: parseFloat(row.amount) || 0,
          date: row.date,
          category: row.category,
          paymentMethod: row.paymentMethod,
        });
        done++;
      } catch { failed++; }
      setProgress({ done: done + failed, total: selectedRows.length, failed });
    }
    setProgress(p => ({ ...p, done }));
    setStep('done');
  };

  const handleDone = () => {
    onImported?.();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && step !== 'importing' && onClose()}>
      <div className={styles.modal}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <div className={styles.title}>
            <span aria-hidden="true">📥</span> Import transactions
          </div>
          {step !== 'importing' && (
            <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
          )}
        </div>

        <div className={styles.body}>
          {/* ── UPLOAD STEP ── */}
          {step === 'upload' && (
            <>
              <div
                className={cx(styles.dropzone, dragOver && styles.drag)}
                role="button"
                tabIndex={0}
                aria-label="Choose a CSV or PDF bank statement"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); }
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className={styles.dropzoneIcon} aria-hidden="true">{parsing ? '⏳' : '📂'}</div>
                <div className={styles.dropzoneTitle}>
                  {parsing ? 'Parsing file…' : 'Drop your bank statement here'}
                </div>
                {!parsing && (
                  <div className={styles.dropzoneSub}>
                    or <span>click to browse</span>
                  </div>
                )}
                <div className={styles.formats}>
                  <div className={styles.fmtBadge}><span aria-hidden="true">📄</span> CSV</div>
                  <div className={styles.fmtBadge}><span aria-hidden="true">📑</span> PDF</div>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.pdf,text/csv,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const input = e.target;
                  // Cleared only after reading, so you can pick the same file again after an error
                  handleFile(input.files[0]).finally(() => { input.value = ''; });
                }}
              />
              {parseError && <div className={styles.error} role="alert">{parseError}</div>}
              <div className={styles.help}>
                <strong>CSV:</strong> Supports standard bank statement exports. Columns for date, description, and debit/amount are auto-detected.<br />
                <strong>PDF:</strong> Text-based PDFs only (not scanned images). Results depend on the bank's PDF format.
              </div>
            </>
          )}

          {/* ── REVIEW STEP ── */}
          {step === 'review' && (
            <>
              <div className={styles.reviewInfo}>
                <span>{rows.length} transactions found</span>
                <button className={styles.selectAll} onClick={toggleAll}>
                  {rows.every(r => r.selected) ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <ul className={styles.reviewList}>
                {rows.map((row, i) => (
                  <li key={i} className={cx(styles.reviewCard, !row.selected && styles.deselected)}>
                    <div className={styles.reviewTop}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={row.selected}
                        onChange={() => toggleRow(i)}
                        aria-label={`Import "${row.expense}"`}
                      />
                      <input
                        className={cx(styles.tdInput, styles.descInput)}
                        aria-label="Description"
                        value={row.expense}
                        onChange={(e) => updateRow(i, 'expense', e.target.value)}
                      />
                    </div>
                    <div className={styles.reviewGrid}>
                      <label className={styles.fieldLabel}>
                        Date
                        <input
                          className={styles.tdInput}
                          type="date"
                          value={row.date}
                          onChange={(e) => updateRow(i, 'date', e.target.value)}
                        />
                      </label>
                      <label className={styles.fieldLabel}>
                        Amount (₹)
                        <input
                          className={styles.tdInput}
                          type="number"
                          inputMode="decimal"
                          value={row.amount}
                          min="0"
                          step="0.01"
                          onChange={(e) => updateRow(i, 'amount', e.target.value)}
                        />
                      </label>
                      <label className={styles.fieldLabel}>
                        Category
                        <select
                          className={styles.tdSelect}
                          value={row.category}
                          onChange={(e) => updateRow(i, 'category', e.target.value)}
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{getCategoryIcon(c)} {c}</option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.fieldLabel}>
                        Payment
                        <select
                          className={styles.tdSelect}
                          value={row.paymentMethod}
                          onChange={(e) => updateRow(i, 'paymentMethod', e.target.value)}
                        >
                          {PAYMENT_METHODS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                className={styles.importBtn}
                disabled={selectedRows.length === 0}
                onClick={handleImport}
              >
                Import {selectedRows.length} transaction{selectedRows.length !== 1 ? 's' : ''}
              </button>
            </>
          )}

          {/* ── IMPORTING STEP ── */}
          {step === 'importing' && (
            <div className={styles.progressWrap}>
              <div className={styles.progressLabel}>Importing transactions…</div>
              <div className={styles.progressBarBg} style={{ width: '100%' }}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
              <div className={styles.progressSub}>
                {progress.done} / {progress.total} done
                {progress.failed > 0 && ` · ${progress.failed} failed`}
              </div>
            </div>
          )}

          {/* ── DONE STEP ── */}
          {step === 'done' && (
            <div className={styles.done}>
              <div className={styles.doneIcon} aria-hidden="true">{progress.failed === 0 ? '🎉' : '⚠️'}</div>
              <div className={styles.doneTitle}>
                {progress.done} transaction{progress.done !== 1 ? 's' : ''} imported!
              </div>
              {progress.failed > 0 && (
                <div className={styles.doneSub}>{progress.failed} failed to import.</div>
              )}
              <button className={styles.doneBtn} onClick={handleDone}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportTransactions;
