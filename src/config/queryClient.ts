import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Shared TanStack Query client. Constructed once in this typed module (rather
 * than inline in index.js) so the query cache configuration lives in one place.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep cache for a full day
      staleTime: 1000 * 60 * 30, // 30 minutes - consider fresh for this long
    },
  },
});

/**
 * Persists the query cache to AsyncStorage so forecasts survive cold starts and
 * offline launches.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "REACT_QUERY_OFFLINE_CACHE",
});
