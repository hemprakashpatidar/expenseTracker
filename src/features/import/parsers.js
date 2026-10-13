import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { todayISO } from '../../shared/dates.js';
import { guessCategory } from '../../shared/guessCategory.js';

// Bank statement parsing for CSV and text-based PDF exports. Dates come out as YYYY-MM-DD.

const cleanAmount = (str = '') =>
  parseFloat(String(str).replace(/[₹,\s]/g, '').replace(/[()]/g, '').trim()) || 0;

const parseDate = (str = '') => {
  str = str.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
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
    const d = named[1], y = named[3];
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
  return todayISO();
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

export const parseCSV = (text) => {
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
    const date = dateIdx !== -1 ? parseDate(cols[dateIdx] || '') : todayISO();
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

const DATE_RX = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{2}[/-]\d{2}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\b/g;
const AMT_RX  = /₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\b/g;

export const parsePDFText = (allText) => {
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

export const extractPDFText = async (file) => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
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
