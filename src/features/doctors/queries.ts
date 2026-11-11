import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ApiContext,
  type CreateDoctor,
  createDoctor,
  deleteDoctor,
  getDoctor,
  getDoctorAnalytics,
  getDoctorFilters,
  listDoctors,
  type UpdateDoctor,
  updateDoctor,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { DoctorListQuery } from "./params";

/**
 * `context` is only passed on the server, to forward the session cookie. It is left
 * out of the key so a server-fetched result hydrates the browser's query.
 */
export const doctorQueries = {
  list: (query: DoctorListQuery, context?: ApiContext) =>
    queryOptions({
      queryKey: [...queryKeys.doctors, "list", query],
      queryFn: async ({ signal }) =>
        (await listDoctors({ query, signal, throwOnError: true, ...context })).data,
      // Keep the current page on screen while the next one loads.
      placeholderData: keepPreviousData,
    }),

  detail: (id: string, context?: ApiContext) =>
    queryOptions({
      queryKey: [...queryKeys.doctors, "detail", id],
      queryFn: async ({ signal }) =>
        (await getDoctor({ path: { id }, signal, throwOnError: true, ...context })).data,
    }),

  /** Months are grouped in the visitor's time zone, so this one is fetched by the browser. */
  analytics: (id: string, timezone: string) =>
    queryOptions({
      queryKey: [...queryKeys.doctors, "analytics", id, timezone],
      queryFn: async ({ signal }) =>
        (await getDoctorAnalytics({ path: { id }, query: { timezone }, signal, throwOnError: true }))
          .data,
    }),

  filters: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...queryKeys.doctors, "filters"],
      queryFn: async ({ signal }) =>
        (await getDoctorFilters({ signal, throwOnError: true, ...context })).data,
      staleTime: 5 * 60_000,
    }),
};

/** Doctor changes also move the dashboard's numbers. */
function useInvalidateDoctors() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics }),
    ]);
}

export function useCreateDoctor() {
  const invalidate = useInvalidateDoctors();
  return useMutation({
    mutationFn: async (body: CreateDoctor) =>
      (await createDoctor({ body, throwOnError: true })).data,
    // Returning the promise keeps the mutation pending until the lists are fresh.
    onSuccess: invalidate,
  });
}

export function useUpdateDoctor(id: string) {
  const invalidate = useInvalidateDoctors();
  return useMutation({
    mutationFn: async (body: UpdateDoctor) =>
      (await updateDoctor({ path: { id }, body, throwOnError: true })).data,
    onSuccess: invalidate,
  });
}

export function useDeleteDoctor() {
  const invalidate = useInvalidateDoctors();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoctor({ path: { id }, throwOnError: true });
    },
    onSuccess: invalidate,
  });
}
