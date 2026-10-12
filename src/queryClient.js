import { QueryClient } from '@tanstack/react-query';

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // A month's list is reused for a minute before a background refresh
      staleTime: 60 * 1000,
      // Mutations keep the cache current; don't refetch every time the tab or a modal regains focus
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
