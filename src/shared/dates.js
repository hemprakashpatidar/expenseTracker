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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Parse as a local calendar date; new Date('2026-10-05') would be UTC midnight
const fromISO = (iso) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// '2026-10-05' -> '5 Oct'
export const formatShortDate = (iso) => {
  if (!iso) return 'No date';
  const date = fromISO(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
};

// '2026-10-05' -> 'Mon, 5 Oct 2026'
export const formatLongDate = (iso) => {
  if (!iso) return 'No date';
  const date = fromISO(iso);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

// List headings: 'Today', 'Yesterday', otherwise 'Mon, 5 Oct' (year added when it isn't this year)
export const formatDayHeading = (iso, now = new Date()) => {
  if (!iso) return 'No date';
  const today = toISODate(now);
  const yesterday = toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  const date = fromISO(iso);
  const sameYear = date.getFullYear() === now.getFullYear();
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}${sameYear ? '' : ` ${date.getFullYear()}`}`;
};
