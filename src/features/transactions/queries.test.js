import { QueryClient } from '@tanstack/react-query';
import { applySaved, applyDeleted, transactionKeys } from './queries.js';

const row = (id, date, amount = 10) => ({ id, date, amount, expense: id, category: 'Other', paymentMethod: 'UPI' });
const oct = transactionKeys.month(10, 2026);
const nov = transactionKeys.month(11, 2026);

const setup = () => {
  const qc = new QueryClient();
  qc.setQueryData(oct, [row('a', '2026-10-05'), row('b', '2026-10-09')]);
  qc.setQueryData(nov, [row('c', '2026-11-01')]);
  return qc;
};

test('an edit within the month replaces the row in place', () => {
  const qc = setup();
  applySaved(qc, row('a', '2026-10-05', 99));
  expect(qc.getQueryData(oct)).toEqual([row('a', '2026-10-05', 99), row('b', '2026-10-09')]);
  expect(qc.getQueryData(nov)).toEqual([row('c', '2026-11-01')]);
});

test('an edit that changes the month moves the row between cached months', () => {
  const qc = setup();
  applySaved(qc, row('a', '2026-11-20'));
  expect(qc.getQueryData(oct).map(r => r.id)).toEqual(['b']);
  expect(qc.getQueryData(nov).map(r => r.id)).toEqual(['a', 'c']);
});

test('a delete removes the row from every cached month', () => {
  const qc = setup();
  applyDeleted(qc, 'b');
  expect(qc.getQueryData(oct).map(r => r.id)).toEqual(['a']);
  expect(qc.getQueryData(nov).map(r => r.id)).toEqual(['c']);
});
