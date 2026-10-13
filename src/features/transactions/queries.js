import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../../api/transactions.js';

// The cache holds the server's rows as-is (ISO dates)
export const transactionKeys = {
  all: ['transactions'],
  month: (month, year) => ['transactions', year, month],
};

const toRow = (t) => ({ ...t, expense: t.expense || '—' });
// Module-level so the query can memoise the result between renders
const selectRows = (rows) => rows.map(toRow);

const monthPrefix = ([, year, month]) => `${year}-${String(month).padStart(2, '0')}`;

// Put the saved copy into every cached month it belongs to and drop it from the rest,
// so an edit that changes the date moves the row without a refetch
export const applySaved = (queryClient, saved) => {
  for (const [key, rows] of queryClient.getQueriesData({ queryKey: transactionKeys.all })) {
    if (!rows) continue;
    const belongs = saved.date?.startsWith(monthPrefix(key));
    const others = rows.filter(t => t.id !== saved.id);
    const wasHere = others.length !== rows.length;
    if (belongs) {
      queryClient.setQueryData(key, wasHere ? rows.map(t => t.id === saved.id ? saved : t) : [saved, ...rows]);
    } else if (wasHere) {
      queryClient.setQueryData(key, others);
    }
  }
};

export const applyDeleted = (queryClient, id) => {
  queryClient.setQueriesData({ queryKey: transactionKeys.all }, rows => rows?.filter(t => t.id !== id));
};

export const useMonthTransactions = (month, year) => useQuery({
  queryKey: transactionKeys.month(month, year),
  queryFn: () => listTransactions(month, year),
  select: selectRows,
});

// This calendar month and the one before, whichever month is on screen. Usually both are
// already cached from browsing, so this rarely costs a request.
export const useLatestTransactions = () => {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const current = useMonthTransactions(now.getMonth() + 1, now.getFullYear());
  const before = useMonthTransactions(previous.getMonth() + 1, previous.getFullYear());
  return useMemo(
    () => [...(current.data || []), ...(before.data || [])],
    [current.data, before.data]
  );
};

// New rows get their id from the server, so lists are refetched rather than patched
export const useInvalidateTransactions = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: transactionKeys.all });
};

export const useCreateTransaction = () => {
  const invalidate = useInvalidateTransactions();
  return useMutation({ mutationFn: createTransaction, onSuccess: invalidate });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }) => updateTransaction(id, changes),
    onSuccess: saved => applySaved(queryClient, saved),
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: (_, id) => applyDeleted(queryClient, id),
  });
};
