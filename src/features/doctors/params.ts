import { createLoader, parseAsString } from "nuqs/server";
import type { ListDoctorsData } from "@/lib/api";
import { dateRangeQuery, listParams } from "@/lib/list-params";

export const doctorParams = {
  ...listParams,
  specialization: parseAsString,
  hospital: parseAsString,
};

/** Reads the same URL state on the server, so the first page can be fetched before render. */
export const loadDoctorParams = createLoader(doctorParams);
export type DoctorParams = Awaited<ReturnType<typeof loadDoctorParams>>;

export type DoctorListQuery = NonNullable<ListDoctorsData["query"]>;

/** Server and browser both build the request here, so their query keys always match. */
export function toDoctorQuery(params: DoctorParams): DoctorListQuery {
  const search = params.search.trim();
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
