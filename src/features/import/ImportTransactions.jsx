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
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'pdf'].includes(ext)) {
      setParseError('Only CSV and PDF files are supported.');
      return;
    }
    setParsing(true);
    setParseError('');
    try {
      let parsed = [];
      if (ext === 'csv') {
        const text = await file.text();
        parsed = parseCSV(text);
      } else {
        const text = await extractPDFText(file);
        parsed = parsePDFText(text);
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
      setParseError('Failed to parse file. ' + (err.message || ''));
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
            📥 Import Transactions
          </div>
          {step !== 'importing' && (
            <button className={styles.close} onClick={onClose}>✕</button>
          )}
        </div>

        <div className={styles.body}>
          {/* ── UPLOAD STEP ── */}
          {step === 'upload' && (
            <>
              <div
                className={cx(styles.dropzone, dragOver && styles.drag)}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className={styles.dropzoneIcon}>{parsing ? '⏳' : '📂'}</div>
                <div className={styles.dropzoneTitle}>
                  {parsing ? 'Parsing file…' : 'Drop your bank statement here'}
                </div>
                {!parsing && (
                  <div className={styles.dropzoneSub}>
                    or <span>click to browse</span>
                  </div>
                )}
                <div className={styles.formats}>
                  <div className={styles.fmtBadge}>📄 CSV</div>
                  <div className={styles.fmtBadge}>📑 PDF</div>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {parseError && <div className={styles.error}>{parseError}</div>}
              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.6 }}>
                <strong style={{ color: '#6b7280' }}>CSV:</strong> Supports standard bank statement exports. Columns for date, description, and debit/amount are auto-detected.<br />
                <strong style={{ color: '#6b7280' }}>PDF:</strong> Text-based PDFs only (not scanned images). Results depend on the bank's PDF format.
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

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 28 }}></th>
                      <th>Description</th>
                      <th style={{ width: 80 }}>Date</th>
                      <th style={{ width: 80 }}>Amount</th>
                      <th style={{ width: 110 }}>Category</th>
                      <th style={{ width: 100 }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={row.selected ? undefined : styles.deselected}>
                        <td>
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRow(i)}
                            style={{ cursor: 'pointer', accentColor: '#4f46e5' }}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.tdInput}
                            value={row.expense}
                            onChange={(e) => updateRow(i, 'expense', e.target.value)}
                            style={{ minWidth: 100 }}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.tdInput}
                            type="date"
                            value={row.date}
                            onChange={(e) => updateRow(i, 'date', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.tdInput}
                            type="number"
                            value={row.amount}
                            min="0"
                            step="0.01"
                            onChange={(e) => updateRow(i, 'amount', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className={styles.tdSelect}
                            value={row.category}
                            onChange={(e) => updateRow(i, 'category', e.target.value)}
                          >
                            {CATEGORIES.map(c => (
                              <option key={c} value={c}>{getCategoryIcon(c)} {c}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className={styles.tdSelect}
                            value={row.paymentMethod}
                            onChange={(e) => updateRow(i, 'paymentMethod', e.target.value)}
                          >
                            {PAYMENT_METHODS.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
              <div className={styles.doneIcon}>{progress.failed === 0 ? '🎉' : '⚠️'}</div>
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
