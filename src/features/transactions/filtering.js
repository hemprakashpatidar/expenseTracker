const compare = (a, b, sortBy) => {
  switch (sortBy) {
    case 'date': {
      // ISO dates compare correctly as strings; undated rows go last
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
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

// Consecutive rows with the same date become one group; call on rows already sorted by date
export const groupByDay = (transactions) => transactions.reduce((groups, t) => {
  const last = groups[groups.length - 1];
  if (last && last.date === t.date) {
    last.items.push(t);
    last.total += t.amount;
  } else {
    groups.push({ date: t.date, items: [t], total: t.amount });
  }
  return groups;
}, []);
