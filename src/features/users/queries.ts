import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiContext, type CreateUser, type UpdateUser, unwrap } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { UserListQuery } from "./params";

/**
 * `context` is only passed on the server, to forward the session cookie. It is left
 * out of the key so a server-fetched result hydrates the browser's query.
 */
export const userQueries = {
  list: (query: UserListQuery, context?: ApiContext) =>
    queryOptions({
      queryKey: [...queryKeys.users, "list", query],
      queryFn: ({ signal }) => unwrap(api.GET("/api/v1/users", { params: { query }, signal, ...context })),
      // Keep the current page on screen while the next one loads.
      placeholderData: keepPreviousData,
    }),
};

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.users });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (body: CreateUser) => unwrap(api.POST("/api/v1/users", { body })),
    // Returning the promise keeps the mutation pending until the list is fresh.
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUser }) =>
      unwrap(api.PATCH("/api/v1/users/{id}", { params: { path: { id } }, body })),
    onSuccess: invalidate,
  });
}

/** The list shows nothing about passwords, so there is nothing to refresh. */
export function useResetUserPassword(id: string) {
  return useMutation({
    mutationFn: async (password: string) => {
      await unwrap(api.POST("/api/v1/users/{id}/password", { params: { path: { id } }, body: { password } }));
    },
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (id: string) => {
      await unwrap(api.DELETE("/api/v1/users/{id}", { params: { path: { id } } }));
    },
    onSuccess: invalidate,
  });
}
