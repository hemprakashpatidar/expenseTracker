import { vi } from 'vitest';

vi.mock('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url', () => ({ default: 'worker.js' }));
const { parseCSV, parsePDFText } = await import('./parsers.js');

test('parses a bank CSV, detecting columns, delimiter and quoted commas', () => {
  const csv = [
    'Txn Date;Narration;Debit;Mode',
    '05/10/2026;"SWIGGY, Bangalore";₹1,250.50;UPI',
    '06/10/2026;Salary;0;NEFT',
    '2026-10-07;UBER TRIP;120;Card',
  ].join('\n');
  expect(parseCSV(csv)).toEqual([
    { expense: 'SWIGGY, Bangalore', amount: 1250.5, date: '2026-10-05', category: 'Food & Dining', paymentMethod: 'UPI', selected: true },
    { expense: 'UBER TRIP', amount: 120, date: '2026-10-07', category: 'Transportation', paymentMethod: 'Card', selected: true },
  ]);
});

test('returns nothing without an amount column', () => {
  expect(parseCSV('date,description\n01/10/2026,thing')).toEqual([]);
});

test('extracts date, description and last amount from PDF text lines', () => {
  const rows = parsePDFText('15 Oct 2026 NETFLIX SUBSCRIPTION 649.00\nOpening balance\n');
  expect(rows).toEqual([
    { expense: 'NETFLIX SUBSCRIPTION', amount: 649, date: '2026-10-15', category: 'Entertainment', paymentMethod: 'Other', selected: true },
  ]);
});
