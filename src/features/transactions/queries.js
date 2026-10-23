import { useCallback, useMemo } from 'react';
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

const findCached = (queryClient, id) => {
  for (const [, rows] of queryClient.getQueriesData({ queryKey: transactionKeys.all })) {
    const row = rows?.find(t => t.id === id);
    if (row) return row;
  }
  return null;
};

// Rows the server hasn't confirmed yet carry pending: true (and, for new ones, a temporary id)
let nextTempId = 1;

const monthQuery = (month, year) => ({
  queryKey: transactionKeys.month(month, year),
  queryFn: () => listTransactions(month, year),
});

export const useMonthTransactions = (month, year) => useQuery({ ...monthQuery(month, year), select: selectRows });

// Loads a month into the cache ahead of time (no-op while it's cached and fresh)
export const usePrefetchMonth = () => {
  const queryClient = useQueryClient();
  return useCallback((month, year) => queryClient.prefetchQuery(monthQuery(month, year)), [queryClient]);
};

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

// For changes made outside this cache (imports), refetch every cached month
export const useInvalidateTransactions = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: transactionKeys.all });
};

// The new row shows straight away under a temporary id, then is swapped for the server's copy,
// or removed again if saving fails
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onMutate: (input) => {
      const tempId = `pending-${nextTempId++}`;
      applySaved(queryClient, { ...input, id: tempId, pending: true });
      return { tempId };
    },
    onSuccess: (saved, _, { tempId }) => {
      applyDeleted(queryClient, tempId);
      applySaved(queryClient, saved);
    },
    onError: (_, __, context) => applyDeleted(queryClient, context.tempId),
  });
};

// The edit shows straight away; a failed save puts the old row back
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }) => updateTransaction(id, changes),
    onMutate: ({ id, changes }) => {
      const previous = findCached(queryClient, id);
      if (previous) applySaved(queryClient, { ...previous, ...changes, pending: true });
      return { previous };
    },
    onSuccess: saved => applySaved(queryClient, saved),
    onError: (_, __, context) => {
      if (context.previous) applySaved(queryClient, context.previous);
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: (_, id) => applyDeleted(queryClient, id),
  });
};
