// Dates travel and live in state as ISO 'YYYY-MM-DD' strings; only the UI shows dd-mm-yy.
// Everything here uses the local calendar day: toISOString() is UTC and would be a day off near midnight.

const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayISO = () => toISODate(new Date());

// '2026-10-05' -> '05-10-26'; missing dates show as an em dash
export const formatDisplayDate = (iso) => {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-');
  return `${day}-${month}-${year.slice(-2)}`;
};
