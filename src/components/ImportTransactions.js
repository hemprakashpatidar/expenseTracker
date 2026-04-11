import React, { useRef, useState } from 'react';
import { getAuthData, apiPost } from '../utils/api.js';
import { getCategoryIcon } from '../utils/categoryUtils.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Groceries', 'Other',
];
const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'PhonePe', 'PayTM', 'Google Pay', 'Bank Transfer', 'RuPay', 'Wallet', 'Other'];

const CATEGORY_KEYWORDS = {
  'Food & Dining': ['swiggy', 'zomato', 'domino', 'pizza', 'restaurant', 'cafe', 'food', 'dining', 'hotel', 'eat', 'biryani', 'burger', 'starbucks', 'mcdonalds', 'kfc', 'blinkit'],
  Transportation: ['uber', 'ola', 'rapido', 'auto', 'taxi', 'cab', 'petrol', 'fuel', 'metro', 'bus', 'train', 'irctc', 'flight', 'airline'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'shop', 'store', 'mall', 'retail', 'meesho', 'market'],
  Entertainment: ['netflix', 'hotstar', 'prime', 'spotify', 'youtube', 'jio cinema', 'movie', 'cinema', 'theater', 'pvr', 'inox', 'game'],
  'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'broadband', 'mobile', 'recharge', 'bill', 'utility', 'airtel', 'jio', 'vi ', 'bsnl', 'postpaid'],
  Healthcare: ['pharmacy', 'chemist', 'doctor', 'hospital', 'clinic', 'medical', 'medicine', 'apollo', 'thyrocare', 'lab'],
  Travel: ['hotel', 'oyo', 'makemytrip', 'goibibo', 'booking', 'airbnb', 'resort', 'inn'],
  Education: ['course', 'udemy', 'coursera', 'byju', 'unacademy', 'school', 'college', 'fees', 'tuition', 'book', 'stationary'],
  Groceries: ['bigbasket', 'grofer', 'dunzo', 'grocery', 'supermarket', 'kirana', 'vegetables', 'fruit', 'zepto'],
};

const guessCategory = (desc = '') => {
  const lower = desc.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return 'Other';
};

const cleanAmount = (str = '') =>
  parseFloat(String(str).replace(/[₹,\s]/g, '').replace(/[()]/g, '').trim()) || 0;

const parseDate = (str = '') => {
  str = str.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // MM/DD/YYYY
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // "15 Jan 2024" or "Jan 15, 2024"
  const months = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
  const named = str.match(/(\d{1,2})\s+([a-z]{3})\s+(\d{2,4})/i) || str.match(/([a-z]{3})\s+(\d{1,2}),?\s+(\d{4})/i);
  if (named) {
    const d = named[1], mon = named[2], y = named[3];
    if (isNaN(d)) {
      // month-first
      const mm = months[named[1].toLowerCase()];
      if (mm) return `${named[3]}-${String(mm).padStart(2,'0')}-${String(named[2]).padStart(2,'0')}`;
    } else {
      const mm = months[named[2].toLowerCase()];
      const year = y.length === 2 ? `20${y}` : y;
      if (mm) return `${year}-${String(mm).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }
  }
  return new Date().toISOString().split('T')[0];
};

// ── CSV parser ────────────────────────────────────────────────────────────────

const detectDelimiter = (text) => {
  const counts = { ',': 0, ';': 0, '\t': 0 };
  for (const ch of text.slice(0, 2000)) if (ch in counts) counts[ch]++;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

const parseCSVLine = (line, delim) => {
  const result = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === delim && !inQuote) { result.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
};

const findColIndex = (headers, candidates) => {
  const lower = headers.map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
  for (const c of candidates) {
    const idx = lower.findIndex(h => h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
};

const parseCSV = (text) => {
  const delim = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0], delim);
  const dateIdx = findColIndex(headers, ['date', 'txndate', 'transactiondate', 'valuedate', 'postingdate']);
  const descIdx = findColIndex(headers, ['description', 'narration', 'particulars', 'detail', 'remarks', 'ref', 'payee', 'memo', 'name','expense']);
  const amtIdx  = findColIndex(headers, ['debit', 'withdrawal', 'amount', 'amt', 'dr', 'spent']);
  const categoryIdx = findColIndex(headers, ['category', 'type', 'classification', 'nature', 'group', 'category']);
  const paymentMethodIdx = findColIndex(headers, ['paymentmethod', 'payment', 'mode', 'method', 'paymenttype', 'paymentmethod']);

  if (amtIdx === -1) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delim);
    if (cols.length < 2) continue;
    const rawAmt = cols[amtIdx] || '';
    if (!rawAmt || rawAmt === '-' || rawAmt === '0') continue;
    const amount = cleanAmount(rawAmt);
    if (amount <= 0) continue;
    const desc = descIdx !== -1 ? cols[descIdx] || '' : cols.filter((_, idx) => idx !== dateIdx && idx !== amtIdx).join(' ');
    const date = dateIdx !== -1 ? parseDate(cols[dateIdx] || '') : new Date().toISOString().split('T')[0];
    rows.push({
      expense: desc.slice(0, 100).trim() || 'Imported',
      amount,
      date,
      category: categoryIdx !== -1 ? cols[categoryIdx] || guessCategory(desc) : guessCategory(desc),
      paymentMethod: paymentMethodIdx !== -1 ? cols[paymentMethodIdx] || 'Other' : 'Other',
      selected: true,
    });
  }
  return rows;
};

// ── PDF parser ────────────────────────────────────────────────────────────────

const DATE_RX = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\b/g;
const AMT_RX  = /₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\b/g;

const parsePDFText = (allText) => {
  const lines = allText.split('\n').map(l => l.trim()).filter(Boolean);
  const rows = [];

  for (const line of lines) {
    const dates = [...line.matchAll(DATE_RX)];
    const amounts = [...line.matchAll(AMT_RX)];
    if (dates.length === 0 || amounts.length === 0) continue;

    // Use last numeric match as amount (often the transaction amount is at end)
    const rawAmt = amounts[amounts.length - 1][1];
    const amount = cleanAmount(rawAmt);
    if (amount <= 0 || amount > 10000000) continue; // skip zero / unrealistic

    const dateStr = parseDate(dates[0][0]);
    // Remove date and amount from line to get description
    let desc = line
      .replace(DATE_RX, '')
      .replace(AMT_RX, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 100);
    if (!desc) desc = 'Imported';

    rows.push({
      expense: desc,
      amount,
      date: dateStr,
      category: guessCategory(desc),
      paymentMethod: 'Other',
      selected: true,
    });
  }
  return rows;
};

const extractPDFText = async (file) => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map(i => i.str).join(' ') + '\n';
  }
  return text;
};

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
    const userData = getAuthData();
    let done = 0, failed = 0;
    setProgress({ done: 0, total: selectedRows.length, failed: 0 });

    for (const row of selectedRows) {
      try {
        const resp = await apiPost('/api/transaction', {
          userName: userData?.userName || '',
          uuid: userData?.uuid || '',
          isMe: userData?.isMe || false,
          expense: row.expense,
          amount: parseFloat(row.amount) || 0,
          date: row.date,
          category: row.category,
          paymentMethod: row.paymentMethod,
        });
        if (resp.ok) done++; else failed++;
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
