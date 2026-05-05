import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

/** Root query client — 24h stale; jobs / proposals cache offline. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7,
      staleTime: 1000 * 60 * 60 * 24,
      retry: 1,
    },
  },
});

export const rqAsyncStoragePersister: Persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "PA_REACT_QUERY_V1",
  serialize: (client) => JSON.stringify(client),
  deserialize: (cached) => JSON.parse(cached) as PersistedClient,
});

export const rqPersistDehydrateOptions = {
  shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) => {
    const root = query.queryKey[0];
    return (
      root === "jobs" ||
      root === "job" ||
      root === "proposals" ||
      root === "sequences" ||
      root === "pipeline"
    );
  },
};
