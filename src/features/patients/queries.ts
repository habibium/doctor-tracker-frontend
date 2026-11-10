import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ApiContext,
  type CreatePatient,
  createDoctorPatient,
  deleteDoctorPatient,
  deletePatient,
  listPatients,
  type Patient,
  type PatientList,
  type UpdatePatient,
  updatePatient,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { PatientListQuery } from "./params";

const listKey = [...queryKeys.patients, "list"] as const;

export const patientQueries = {
  /** A `doctorId` in the query scopes the list to one doctor's patients. */
  list: (query: PatientListQuery, context?: ApiContext) =>
    queryOptions({
      queryKey: [...listKey, query],
      queryFn: async ({ signal }) =>
        (await listPatients({ query, signal, throwOnError: true, ...context })).data,
      placeholderData: keepPreviousData,
    }),
};

/** A patient change also moves doctors' patient counts and the dashboard. */
function useInvalidatePatients() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patients }),
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics }),
    ]);
}

export function useCreatePatient() {
  const invalidate = useInvalidatePatients();
  return useMutation({
    mutationFn: async ({ doctorId, ...body }: CreatePatient) =>
      (await createDoctorPatient({ path: { id: doctorId }, body, throwOnError: true })).data,
    onSuccess: invalidate,
  });
}

export function useUpdatePatient(id: string) {
  const invalidate = useInvalidatePatients();
  return useMutation({
    mutationFn: async (body: UpdatePatient) =>
      (await updatePatient({ path: { id }, body, throwOnError: true })).data,
    onSuccess: invalidate,
  });
}

/**
 * Removes the row from every cached page at once, then lets the server confirm.
 * If the request fails, the saved pages are put back.
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidatePatients();

  return useMutation({
    mutationFn: async (patient: Patient) => {
      if (patient.doctor) {
        const path = { id: patient.doctor.id, patientId: patient.id };
        await deleteDoctorPatient({ path, throwOnError: true });
      } else {
        await deletePatient({ path: { id: patient.id }, throwOnError: true });
      }
    },
    onMutate: async (patient) => {
      // A refetch landing mid-flight would bring the row back.
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueriesData<PatientList>({ queryKey: listKey });

      queryClient.setQueriesData<PatientList>({ queryKey: listKey }, (page) => {
        if (!page?.data.some((row) => row.id === patient.id)) return page;
        return {
          data: page.data.filter((row) => row.id !== patient.id),
          meta: { ...page.meta, total: page.meta.total - 1 },
        };
      });
      return { previous };
    },
    onError: (_error, _patient, context) => {
      for (const [key, page] of context?.previous ?? []) queryClient.setQueryData(key, page);
    },
    onSettled: invalidate,
  });
}
