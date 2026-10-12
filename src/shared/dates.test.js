import { vi } from 'vitest';
import { toISODate, todayISO, formatDisplayDate } from './dates.js';

test('formats ISO dates for display without timezone shifts', () => {
  expect(formatDisplayDate('2026-10-05')).toBe('05-10-26');
  expect(formatDisplayDate('2026-01-01')).toBe('01-01-26');
  expect(formatDisplayDate(null)).toBe('—');
});

test('today is the local calendar day, not the UTC one', () => {
  vi.useFakeTimers();
  // 00:30 on 13 Oct in IST is still 12 Oct in UTC
  vi.setSystemTime(new Date(2026, 9, 13, 0, 30));
  expect(todayISO()).toBe('2026-10-13');
  vi.useRealTimers();
});

test('toISODate pads month and day', () => {
  expect(toISODate(new Date(2026, 2, 7))).toBe('2026-03-07');
});
