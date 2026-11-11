import { createLoader, parseAsString } from "nuqs/server";
import type { ListDoctorsData } from "@/lib/api";
import { dateRangeQuery, listParams, searchTerm, sortableColumns, sortParser } from "@/lib/list-params";

export type DoctorListQuery = NonNullable<ListDoctorsData["query"]>;
export type DoctorSort = NonNullable<DoctorListQuery["sort"]>;

/** Columns the API can sort by, keyed by column id; one line makes a header sortable. */
export const DOCTOR_SORTABLE = sortableColumns<DoctorSort>()({
  doctor: { field: "name", label: "Name", kind: "text" },
  createdAt: { field: "createdAt", label: "Added", kind: "date" },
});

export const doctorParams = {
  ...listParams,
  sort: sortParser(DOCTOR_SORTABLE, "-createdAt"),
  specialization: parseAsString,
  hospital: parseAsString,
};

/** Reads the same URL state on the server, so the first page can be fetched before render. */
export const loadDoctorParams = createLoader(doctorParams);
export type DoctorParams = Awaited<ReturnType<typeof loadDoctorParams>>;

/** Server and browser both build the request here, so their query keys always match. */
export function toDoctorQuery(params: DoctorParams): DoctorListQuery {
  const search = searchTerm(params.search);
  return {
    page: Math.max(1, params.page),
    limit: params.limit,
    sort: params.sort,
    ...(search && { search }),
    ...(params.specialization && { specialization: params.specialization }),
    ...(params.hospital && { hospital: params.hospital }),
    ...dateRangeQuery(params.from, params.to),
  };
}
