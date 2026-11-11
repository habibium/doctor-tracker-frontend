import { queryOptions } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

/**
 * The palette sits in the layout, outside the pages' `UserProvider`, so it asks for the
 * role itself: once per page load, and only after the palette is first opened. Hiding
 * actions is a courtesy; the API checks the role on every request.
 */
export const roleQuery = queryOptions({
  queryKey: ["session", "role"],
  queryFn: async ({ signal }) => {
    const { data, error } = await authClient.getSession({ fetchOptions: { signal } });
    if (error) throw new Error(error.message ?? "Could not load your account");
    return data?.user.role === "admin" ? "admin" : "viewer";
  },
  staleTime: Infinity,
  gcTime: Infinity,
});
