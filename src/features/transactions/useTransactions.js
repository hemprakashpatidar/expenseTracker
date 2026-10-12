import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiDelete } from '../../api/client.js';
import { formatDate } from '../../shared/formatters.js';

const toRow = (t) => ({ ...t, expense: t.expense || '—', date: formatDate(t.date) });

export const useTransactions = (month, year) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    // The server merges the default and credit card databases into one list
    apiGet(`/api/transactions?month=${month}&year=${year}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load transactions: ${r.status}`);
        return r.json();
      })
      .then(({ transactions }) => { if (!cancelled) setTransactions(transactions.map(toRow)); })
      .catch(() => { if (!cancelled) setTransactions([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    // Ignore a slow response for a month the user has already left
    return () => { cancelled = true; };
  }, [month, year, refreshKey]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const remove = async (id) => {
    const response = await apiDelete(`/api/transactions/${id}`);
    if (!response.ok) throw new Error(`Delete failed with status ${response.status}`);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // `saved` is the server's copy (ISO date), so it goes through the same mapping as loaded rows
  const replaceLocal = (saved) =>
    setTransactions(prev => prev.map(t => t.id === saved.id ? toRow(saved) : t));

  return { transactions, isLoading, refresh, remove, replaceLocal };
};
