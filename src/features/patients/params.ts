import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";
import type { Gender, ListPatientsData, PatientCondition } from "@/lib/api";
import { dateRangeQuery, listParams } from "@/lib/list-params";

const CONDITION_VALUES: PatientCondition[] = ["stable", "recovering", "under_observation", "critical"];
const GENDER_VALUES: Gender[] = ["female", "male", "other"];

export const patientParams = {
  ...listParams,
  condition: parseAsStringLiteral(CONDITION_VALUES),
  gender: parseAsStringLiteral(GENDER_VALUES),
  doctorId: parseAsString,
};

export const loadPatientParams = createLoader(patientParams);
export type PatientParams = Awaited<ReturnType<typeof loadPatientParams>>;

export type PatientListQuery = NonNullable<ListPatientsData["query"]>;

/** Server and browser both build the request here, so their query keys always match. */
export function toPatientQuery(params: PatientParams): PatientListQuery {
  const search = params.search.trim();
  return {
    page: Math.max(1, params.page),
    limit: params.limit,
    sort: params.sort,
    ...(search && { search }),
    ...(params.condition && { condition: params.condition }),
    ...(params.gender && { gender: params.gender }),
    ...(params.doctorId && { doctorId: params.doctorId }),
    ...dateRangeQuery(params.from, params.to),
  };
}
