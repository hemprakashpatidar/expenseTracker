// Dates in state are display strings (dd-mm-yy); '—' means no date
const parseDisplayDate = (value) => {
  const [day, month, year] = value.split('-').map(Number);
  return new Date(2000 + year, month - 1, day);
};

const compare = (a, b, sortBy) => {
  switch (sortBy) {
    case 'date': {
      if (a.date === '—' && b.date === '—') return 0;
      if (a.date === '—') return 1;
      if (b.date === '—') return -1;
      return parseDisplayDate(b.date) - parseDisplayDate(a.date);
    }
    case 'amount':
      return b.amount - a.amount;
    default:
      return 0;
  }
};

export const applyFilters = (transactions, { category, paymentMethod, search, sortBy, sortDirection }) => {
  const term = search.trim().toLowerCase();
  const filtered = transactions.filter(t =>
    (category === 'All' || t.category === category) &&
    (paymentMethod === 'All' || t.paymentMethod === paymentMethod) &&
    (!term || t.expense.toLowerCase().includes(term))
  );
  const direction = sortDirection === 'asc' ? -1 : 1;
  return filtered.sort((a, b) => direction * compare(a, b, sortBy));
};

export const uniqueValues = (transactions, field) => ['All', ...new Set(transactions.map(t => t[field]))];

export const totalByCategory = (transactions) => transactions.reduce((acc, t) => {
  if (!acc[t.category]) acc[t.category] = { total: 0, count: 0 };
  acc[t.category].total += t.amount;
  acc[t.category].count += 1;
  return acc;
}, {});
