import createClient from "openapi-fetch";
import { toApiError } from "./error";
import type { components, operations, paths } from "./openapi";

export const api = createClient<paths>({
  // Browser requests stay same-origin and reach the API through the Next.js rewrite,
  // which keeps the session cookie first-party. Server components call the API directly.
  baseUrl: typeof window === "undefined" ? (process.env.API_URL ?? "http://localhost:4000") : "",
  // Read at call time rather than captured once: Next.js patches the global fetch on the
  // server, and re-patches it in dev.
  fetch: (request) => fetch(request),
});

/** Resolves to the response body. Every failure, network errors included, is thrown as `ApiError`. */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result;
  try {
    result = await request;
  } catch (error) {
    throw toApiError(error, undefined);
  }
  if (!result.response.ok) throw toApiError(result.error, result.response);
  return result.data as T;
}

export { ApiError, errorMessage } from "./error";

/**
 * Extra request options for server-side calls, where the session cookie has to be
 * forwarded by hand. Browser calls send it automatically and pass nothing.
 */
export interface ApiContext {
  headers?: Record<string, string>;
}

type Schemas = components["schemas"];

export type AnalyticsSummary = Schemas["AnalyticsSummary"];
export type ConditionBreakdown = Schemas["ConditionBreakdown"];
export type ConditionCounts = Schemas["ConditionCounts"];
export type ConditionMix = Schemas["ConditionMix"];
export type Coverage = Schemas["Coverage"];
export type CreateDoctor = Schemas["CreateDoctor"];
export type CreatePatient = Schemas["CreatePatient"];
export type CreateUser = Schemas["CreateUser"];
export type Demographics = Schemas["Demographics"];
export type DiagnosisCount = Schemas["DiagnosisCount"];
export type DiagnosisTrends = Schemas["DiagnosisTrends"];
export type Doctor = Schemas["Doctor"];
export type DoctorAnalytics = Schemas["DoctorAnalytics"];
export type DoctorList = Schemas["DoctorList"];
export type Gender = Schemas["Gender"];
export type Holiday = Schemas["Holiday"];
export type IntakeHours = Schemas["IntakeHours"];
export type PaginationMeta = Schemas["PaginationMeta"];
export type Patient = Schemas["Patient"];
export type PatientCondition = Schemas["PatientCondition"];
export type PatientDoctor = Schemas["PatientDoctor"];
export type PatientList = Schemas["PatientList"];
export type Registrations = Schemas["Registrations"];
export type UpdateDoctor = Schemas["UpdateDoctor"];
export type UpdatePatient = Schemas["UpdatePatient"];
export type UpdateUser = Schemas["UpdateUser"];
export type User = Schemas["User"];
export type Workload = Schemas["Workload"];

export type ListDoctorsData = operations["listDoctors"]["parameters"];
export type ListPatientsData = operations["listPatients"]["parameters"];
export type ListUsersData = operations["listUsers"]["parameters"];
