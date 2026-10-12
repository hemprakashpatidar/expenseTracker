import { useRef, useState } from 'react';
import { createTransaction } from '../../api/transactions.js';
import { getCategoryIcon } from '../../shared/categoryStyle.js';
import { CATEGORIES, PAYMENT_METHODS } from '../../shared/constants.js';
import { parseCSV, parsePDFText, extractPDFText } from './parsers.js';

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
    <>
      <style>{`
        .imp-overlay {
          position: fixed; inset: 0;
          background: rgba(15,15,30,0.55);
          backdrop-filter: blur(4px);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 10000;
          animation: imp-fade-in 0.2s ease;
        }
        @keyframes imp-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes imp-slide-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .imp-modal {
          background: #fff;
          border-radius: 24px 24px 0 0;
          width: 100%; max-width: 480px;
          max-height: 92vh;
          display: flex; flex-direction: column;
          animation: imp-slide-up 0.28s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }
        .imp-handle { width: 36px; height: 4px; background: #e2e4ea; border-radius: 2px; margin: 12px auto 0; flex-shrink: 0; }
        .imp-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px 12px;
          border-bottom: 1px solid #f0f1f5;
          flex-shrink: 0;
        }
        .imp-title { font-size: 16px; font-weight: 700; color: #1a1a2e; display: flex; align-items: center; gap: 7px; }
        .imp-close {
          width: 30px; height: 30px;
          background: #f3f4f6; border: none; border-radius: 8px;
          font-size: 13px; color: #6b7280; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .imp-close:hover { background: #e5e7eb; color: #1a1a2e; }
        .imp-body { flex: 1; overflow-y: auto; padding: 16px 18px 24px; display: flex; flex-direction: column; gap: 16px; }

        /* Upload zone */
        .imp-dropzone {
          border: 2px dashed #c4b5fd;
          border-radius: 16px;
          padding: 36px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #faf9ff;
        }
        .imp-dropzone.drag { border-color: #4f46e5; background: #ede9ff; }
        .imp-dropzone-icon { font-size: 36px; margin-bottom: 10px; }
        .imp-dropzone-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
        .imp-dropzone-sub { font-size: 12px; color: #9ca3af; }
        .imp-dropzone-sub span { color: #4f46e5; font-weight: 600; }
        .imp-formats { display: flex; gap: 8px; justify-content: center; margin-top: 14px; }
        .imp-fmt-badge {
          background: #f3f4f6; border-radius: 8px; padding: 4px 12px;
          font-size: 12px; font-weight: 700; color: #6b7280;
          display: flex; align-items: center; gap: 4px;
        }

        /* Error */
        .imp-error {
          background: #fff0f0; border: 1.5px solid #fecaca;
          border-radius: 12px; padding: 10px 14px;
          font-size: 13px; color: #ef4444; font-weight: 600;
        }

        /* Review table */
        .imp-review-info {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12px; color: #6b7280; font-weight: 600;
        }
        .imp-select-all {
          background: none; border: none; color: #4f46e5;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif; padding: 0;
        }
        .imp-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #f0f1f5; }
        .imp-table { width: 100%; border-collapse: collapse; min-width: 520px; }
        .imp-table th {
          font-size: 10px; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.5px;
          padding: 8px 10px; text-align: left;
          background: #f8f9fb; border-bottom: 1px solid #f0f1f5;
        }
        .imp-table td { padding: 7px 10px; border-bottom: 1px solid #f8f9fb; vertical-align: middle; }
        .imp-table tr:last-child td { border-bottom: none; }
        .imp-table tr.deselected td { opacity: 0.4; }
        .imp-td-input {
          border: 1px solid #e5e7eb; border-radius: 7px;
          padding: 4px 7px; font-size: 12px; font-family: 'DM Sans', sans-serif;
          color: #1a1a2e; background: #fff; width: 100%;
          outline: none;
        }
        .imp-td-input:focus { border-color: #4f46e5; }
        .imp-td-select {
          border: 1px solid #e5e7eb; border-radius: 7px;
          padding: 4px 6px; font-size: 11px; font-family: 'DM Sans', sans-serif;
          color: #1a1a2e; background: #fff; outline: none; width: 100%;
        }
        .imp-td-select:focus { border-color: #4f46e5; }

        /* Import button */
        .imp-import-btn {
          background: #4f46e5; color: white; border: none;
          border-radius: 12px; padding: 13px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; width: 100%; transition: opacity 0.2s;
        }
        .imp-import-btn:hover { opacity: 0.88; }
        .imp-import-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Progress */
        .imp-progress-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 20px 0; }
        .imp-progress-label { font-size: 14px; font-weight: 600; color: #1a1a2e; }
        .imp-progress-bar-bg { width: 100%; height: 8px; background: #f0f1f5; border-radius: 4px; overflow: hidden; }
        .imp-progress-bar { height: 100%; background: #4f46e5; border-radius: 4px; transition: width 0.3s ease; }
        .imp-progress-sub { font-size: 12px; color: #9ca3af; }

        /* Done */
        .imp-done { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 24px 0; text-align: center; }
        .imp-done-icon { font-size: 48px; }
        .imp-done-title { font-size: 18px; font-weight: 700; color: #1a1a2e; }
        .imp-done-sub { font-size: 13px; color: #9ca3af; }
        .imp-done-btn {
          background: #4f46e5; color: white; border: none;
          border-radius: 12px; padding: 13px 32px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; margin-top: 8px; transition: opacity 0.2s;
        }
        .imp-done-btn:hover { opacity: 0.88; }
      `}</style>

      <div className="imp-overlay" onClick={(e) => e.target === e.currentTarget && step !== 'importing' && onClose()}>
        <div className="imp-modal">
          <div className="imp-handle" />
          <div className="imp-header">
            <div className="imp-title">
              📥 Import Transactions
            </div>
            {step !== 'importing' && (
              <button className="imp-close" onClick={onClose}>✕</button>
            )}
          </div>

          <div className="imp-body">
            {/* ── UPLOAD STEP ── */}
            {step === 'upload' && (
              <>
                <div
                  className={`imp-dropzone${dragOver ? ' drag' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="imp-dropzone-icon">{parsing ? '⏳' : '📂'}</div>
                  <div className="imp-dropzone-title">
                    {parsing ? 'Parsing file…' : 'Drop your bank statement here'}
                  </div>
                  {!parsing && (
                    <div className="imp-dropzone-sub">
                      or <span>click to browse</span>
                    </div>
                  )}
                  <div className="imp-formats">
                    <div className="imp-fmt-badge">📄 CSV</div>
                    <div className="imp-fmt-badge">📑 PDF</div>
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {parseError && <div className="imp-error">{parseError}</div>}
                <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.6 }}>
                  <strong style={{ color: '#6b7280' }}>CSV:</strong> Supports standard bank statement exports. Columns for date, description, and debit/amount are auto-detected.<br />
                  <strong style={{ color: '#6b7280' }}>PDF:</strong> Text-based PDFs only (not scanned images). Results depend on the bank's PDF format.
                </div>
              </>
            )}

            {/* ── REVIEW STEP ── */}
            {step === 'review' && (
              <>
                <div className="imp-review-info">
                  <span>{rows.length} transactions found</span>
                  <button className="imp-select-all" onClick={toggleAll}>
                    {rows.every(r => r.selected) ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                <div className="imp-table-wrap">
                  <table className="imp-table">
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
                        <tr key={i} className={row.selected ? '' : 'deselected'}>
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
                              className="imp-td-input"
                              value={row.expense}
                              onChange={(e) => updateRow(i, 'expense', e.target.value)}
                              style={{ minWidth: 100 }}
                            />
                          </td>
                          <td>
                            <input
                              className="imp-td-input"
                              type="date"
                              value={row.date}
                              onChange={(e) => updateRow(i, 'date', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className="imp-td-input"
                              type="number"
                              value={row.amount}
                              min="0"
                              step="0.01"
                              onChange={(e) => updateRow(i, 'amount', e.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              className="imp-td-select"
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
                              className="imp-td-select"
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
                  className="imp-import-btn"
                  disabled={selectedRows.length === 0}
                  onClick={handleImport}
                >
                  Import {selectedRows.length} transaction{selectedRows.length !== 1 ? 's' : ''}
                </button>
              </>
            )}

            {/* ── IMPORTING STEP ── */}
            {step === 'importing' && (
              <div className="imp-progress-wrap">
                <div className="imp-progress-label">Importing transactions…</div>
                <div className="imp-progress-bar-bg" style={{ width: '100%' }}>
                  <div
                    className="imp-progress-bar"
                    style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="imp-progress-sub">
                  {progress.done} / {progress.total} done
                  {progress.failed > 0 && ` · ${progress.failed} failed`}
                </div>
              </div>
            )}

            {/* ── DONE STEP ── */}
            {step === 'done' && (
              <div className="imp-done">
                <div className="imp-done-icon">{progress.failed === 0 ? '🎉' : '⚠️'}</div>
                <div className="imp-done-title">
                  {progress.done} transaction{progress.done !== 1 ? 's' : ''} imported!
                </div>
                {progress.failed > 0 && (
                  <div className="imp-done-sub">{progress.failed} failed to import.</div>
                )}
                <button className="imp-done-btn" onClick={handleDone}>Done</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportTransactions;
