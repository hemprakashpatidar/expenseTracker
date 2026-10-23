import { QueryClient } from '@tanstack/react-query';

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Saves update the cache directly, so cached data stays right on its own; refresh in the
      // background after 5 minutes, and keep screens you've left for half an hour so going back is instant
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      // Mutations keep the cache current; don't refetch every time the tab or a modal regains focus
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
