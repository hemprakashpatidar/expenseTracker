import { recentExpenses } from './addDefaults.js';

const t = (id, expense, date, category = 'Other', paymentMethod = 'UPI') => ({ id, expense, date, category, paymentMethod, amount: 10 });

test('keeps the newest of each distinct expense, newest first, up to the limit', () => {
  const rows = [
    t('a', 'Chai', '2026-10-01'),
    t('b', 'chai ', '2026-10-05'),
    t('c', 'Chai', '2026-10-03', 'Other', 'Cash'),
    t('d', 'Netflix', '2026-09-06', 'Entertainment', 'Card'),
    t('e', '—', '2026-10-07'),
  ];
  expect(recentExpenses(rows).map(r => r.id)).toEqual(['b', 'c', 'd']);
  expect(recentExpenses(rows, 1).map(r => r.id)).toEqual(['b']);
});
