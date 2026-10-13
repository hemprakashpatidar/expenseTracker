// Small memory for the add form: the payment method used last time (per browser)
const LAST_PAYMENT_KEY = 'expense_tracker_last_payment';
const RECENT_LIMIT = 5;

export const getLastPaymentMethod = () => {
  try { return localStorage.getItem(LAST_PAYMENT_KEY) || null; } catch { return null; }
};

export const saveLastPaymentMethod = (paymentMethod) => {
  try { localStorage.setItem(LAST_PAYMENT_KEY, paymentMethod); } catch { /* not remembered; UPI stays the default */ }
};

// The newest expense for each distinct description + category + payment method, newest first
export const recentExpenses = (transactions, limit = RECENT_LIMIT) => {
  const seen = new Set();
  const result = [];
  const newestFirst = [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  for (const t of newestFirst) {
    if (!t.expense || t.expense === '—') continue;
    const key = `${t.expense.trim().toLowerCase()}|${t.category}|${t.paymentMethod}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(t);
    if (result.length === limit) break;
  }
  return result;
};
