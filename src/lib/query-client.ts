import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

/** A 401 means the session ended: send the user to sign in and bring them back afterwards. */
function redirectWhenSignedOut(error: unknown) {
  if (typeof window === "undefined") return;
  if (!(error instanceof ApiError) || error.status !== 401) return;
  if (window.location.pathname === "/login") return;

  const next = window.location.pathname + window.location.search;
  // A full page load, so no cached data from the ended session stays in memory.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retrying a 4xx cannot succeed; retry only network and server failures.
        retry: (failures, error) => {
          const retryable = !(error instanceof ApiError) || error.status === 0 || error.status >= 500;
          return retryable && failures < 2;
        },
      },
    },
    queryCache: new QueryCache({ onError: redirectWhenSignedOut }),
    mutationCache: new MutationCache({ onError: redirectWhenSignedOut }),
  });
}

let browserQueryClient: QueryClient | undefined;

/** One client per server render so requests never share data; one shared client in the browser. */
export function getQueryClient() {
  if (typeof window === "undefined") return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}
