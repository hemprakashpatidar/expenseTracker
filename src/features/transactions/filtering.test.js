import { applyFilters, uniqueValues, totalByCategory } from './filtering.js';

const rows = [
  { id: 'a', expense: 'Swiggy dinner', amount: 450, date: '05-10-26', category: 'Food & Dining', paymentMethod: 'UPI' },
  { id: 'b', expense: 'Uber', amount: 120, date: '12-10-26', category: 'Transportation', paymentMethod: 'Card' },
  { id: 'c', expense: 'Groceries', amount: 900, date: '01-10-26', category: 'Groceries', paymentMethod: 'UPI' },
  { id: 'd', expense: 'No date', amount: 10, date: '—', category: 'Other', paymentMethod: 'Cash' },
];
const base = { category: 'All', paymentMethod: 'All', search: '', sortBy: 'date', sortDirection: 'desc' };
const ids = (list) => list.map(r => r.id);

test('sorts by date, newest first, undated rows last', () => {
  expect(ids(applyFilters(rows, base))).toEqual(['b', 'a', 'c', 'd']);
});

test('ascending date reverses the order', () => {
  expect(ids(applyFilters(rows, { ...base, sortDirection: 'asc' }))).toEqual(['d', 'c', 'a', 'b']);
});

test('sorts by amount', () => {
  expect(ids(applyFilters(rows, { ...base, sortBy: 'amount' }))).toEqual(['c', 'a', 'b', 'd']);
});

test('combines category, payment method and case-insensitive search', () => {
  expect(ids(applyFilters(rows, { ...base, paymentMethod: 'UPI' }))).toEqual(['a', 'c']);
  expect(ids(applyFilters(rows, { ...base, paymentMethod: 'UPI', category: 'Groceries' }))).toEqual(['c']);
  expect(ids(applyFilters(rows, { ...base, search: '  SWIG ' }))).toEqual(['a']);
});

test('does not mutate its input', () => {
  const copy = [...rows];
  applyFilters(rows, { ...base, sortBy: 'amount' });
  expect(rows).toEqual(copy);
});

test('uniqueValues and totalByCategory', () => {
  expect(uniqueValues(rows, 'paymentMethod')).toEqual(['All', 'UPI', 'Card', 'Cash']);
  expect(totalByCategory([...rows, { ...rows[0], id: 'e', amount: 50 }])['Food & Dining']).toEqual({ total: 500, count: 2 });
});
