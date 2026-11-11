import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ApiContext,
  type CreateUser,
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  type UpdateUser,
  updateUser,
} from "@/lib/api";
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
      queryFn: async ({ signal }) =>
        (await listUsers({ query, signal, throwOnError: true, ...context })).data,
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
    mutationFn: async (body: CreateUser) => (await createUser({ body, throwOnError: true })).data,
    // Returning the promise keeps the mutation pending until the list is fresh.
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateUser }) =>
      (await updateUser({ path: { id }, body, throwOnError: true })).data,
    onSuccess: invalidate,
  });
}

/** The list shows nothing about passwords, so there is nothing to refresh. */
export function useResetUserPassword(id: string) {
  return useMutation({
    mutationFn: async (password: string) => {
      await resetUserPassword({ path: { id }, body: { password }, throwOnError: true });
    },
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteUser({ path: { id }, throwOnError: true });
    },
    onSuccess: invalidate,
  });
}
