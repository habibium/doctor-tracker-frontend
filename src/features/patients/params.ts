import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";
import type { Gender, ListPatientsData, PatientCondition } from "@/lib/api";
import {
  dateRangeQuery,
  listParams,
  recordId,
  searchTerm,
  sortableColumns,
  sortParser,
} from "@/lib/list-params";

const CONDITION_VALUES: PatientCondition[] = ["stable", "recovering", "under_observation", "critical"];
const GENDER_VALUES: Gender[] = ["female", "male", "other"];

export type PatientListQuery = NonNullable<ListPatientsData["query"]>;
export type PatientSort = NonNullable<PatientListQuery["sort"]>;

/** Columns the API can sort by, keyed by column id; one line makes a header sortable. */
export const PATIENT_SORTABLE = sortableColumns<PatientSort>()({
  patient: { field: "name", label: "Name", kind: "text" },
  createdAt: { field: "createdAt", label: "Registered", kind: "date" },
});

export const patientParams = {
  ...listParams,
  sort: sortParser(PATIENT_SORTABLE, "-createdAt"),
  condition: parseAsStringLiteral(CONDITION_VALUES),
  gender: parseAsStringLiteral(GENDER_VALUES),
  doctorId: parseAsString,
};

export const loadPatientParams = createLoader(patientParams);
export type PatientParams = Awaited<ReturnType<typeof loadPatientParams>>;

/** Server and browser both build the request here, so their query keys always match. */
export function toPatientQuery(params: PatientParams): PatientListQuery {
  const search = searchTerm(params.search);
  const doctorId = recordId(params.doctorId);
  return {
    page: Math.max(1, params.page),
    limit: params.limit,
    sort: params.sort,
    ...(search && { search }),
    ...(params.condition && { condition: params.condition }),
    ...(params.gender && { gender: params.gender }),
    ...(doctorId && { doctorId }),
    ...dateRangeQuery(params.from, params.to),
  };
}
