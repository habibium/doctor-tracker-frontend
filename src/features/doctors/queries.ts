import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiContext, type CreateDoctor, type UpdateDoctor, unwrap } from "@/lib/api";
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
      queryFn: ({ signal }) => unwrap(api.GET("/api/v1/doctors", { params: { query }, signal, ...context })),
      // Keep the current page on screen while the next one loads.
      placeholderData: keepPreviousData,
    }),

  detail: (id: string, context?: ApiContext) =>
    queryOptions({
      queryKey: [...queryKeys.doctors, "detail", id],
      queryFn: ({ signal }) =>
        unwrap(api.GET("/api/v1/doctors/{id}", { params: { path: { id } }, signal, ...context })),
    }),

  /** Months are grouped in the visitor's time zone, so this one is fetched by the browser. */
  analytics: (id: string, timezone: string) =>
    queryOptions({
      queryKey: [...queryKeys.doctors, "analytics", id, timezone],
      queryFn: ({ signal }) =>
        unwrap(
          api.GET("/api/v1/doctors/{id}/analytics", { params: { path: { id }, query: { timezone } }, signal }),
        ),
    }),

  filters: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...queryKeys.doctors, "filters"],
      queryFn: ({ signal }) => unwrap(api.GET("/api/v1/doctors/filters", { signal, ...context })),
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
    mutationFn: (body: CreateDoctor) => unwrap(api.POST("/api/v1/doctors", { body })),
    // Returning the promise keeps the mutation pending until the lists are fresh.
    onSuccess: invalidate,
  });
}

export function useUpdateDoctor(id: string) {
  const invalidate = useInvalidateDoctors();
  return useMutation({
    mutationFn: (body: UpdateDoctor) =>
      unwrap(api.PATCH("/api/v1/doctors/{id}", { params: { path: { id } }, body })),
    onSuccess: invalidate,
  });
}

export function useDeleteDoctor() {
  const invalidate = useInvalidateDoctors();
  return useMutation({
    mutationFn: async (id: string) => {
      await unwrap(api.DELETE("/api/v1/doctors/{id}", { params: { path: { id } } }));
    },
    onSuccess: invalidate,
  });
}
