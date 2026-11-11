import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { parseAsStringLiteral } from "nuqs/server";
import { api, type ApiContext, type Registrations, unwrap } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export type Range = Registrations["range"];

export const RANGES: { value: Range; label: string; period: string }[] = [
  { value: "7d", label: "7 days", period: "the last 7 days" },
  { value: "30d", label: "30 days", period: "the last 30 days" },
  { value: "90d", label: "90 days", period: "the last 90 days" },
  { value: "12m", label: "12 months", period: "the last 12 months" },
];

export const rangeParam = parseAsStringLiteral(RANGES.map((range) => range.value)).withDefault("30d");

export type MixGroup = "specialization" | "hospital";
export const MIX_GROUPS: { value: MixGroup; label: string; plural: string }[] = [
  { value: "specialization", label: "Specialization", plural: "specializations" },
  { value: "hospital", label: "Hospital", plural: "hospitals" },
];
export const mixParam = parseAsStringLiteral(MIX_GROUPS.map((group) => group.value)).withDefault(
  "specialization",
);

export type MixOrder = "patients" | "critical";
export const mixOrderParam = parseAsStringLiteral(["patients", "critical"] as const).withDefault(
  "patients",
);

export const TOP_DOCTORS = 8;

export type CoverageMetric = "doctors" | "patients" | "load";
export const COVERAGE_METRICS: { value: CoverageMetric; label: string }[] = [
  { value: "doctors", label: "Doctors" },
  { value: "patients", label: "Patients" },
  { value: "load", label: "Per doctor" },
];
export const coverageParam = parseAsStringLiteral(COVERAGE_METRICS.map((metric) => metric.value)).withDefault(
  "doctors",
);

/** Every diagnosis: the clinic has about sixty, and both rankings are drawn from the same rows. */
const ALL_DIAGNOSES = 100;

const key = queryKeys.analytics;

/** `context` is only passed on the server, to forward the session cookie. */
export const analyticsQueries = {
  summary: (range: Range, context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "summary", range],
      queryFn: ({ signal }) =>
        unwrap(api.GET("/api/v1/analytics/summary", { params: { query: { range } }, signal, ...context })),
      placeholderData: keepPreviousData,
    }),

  /** Days are grouped in the visitor's time zone, so this one is fetched by the browser. */
  registrations: (range: Range, timezone: string) =>
    queryOptions({
      queryKey: [...key, "registrations", range, timezone],
      queryFn: ({ signal }) =>
        unwrap(api.GET("/api/v1/analytics/registrations", { params: { query: { range, timezone } }, signal })),
      placeholderData: keepPreviousData,
    }),

  /** Weekday and hour are read in the visitor's time zone: browser only, like registrations. */
  intakeHours: (range: Range, timezone: string) =>
    queryOptions({
      queryKey: [...key, "intake-hours", range, timezone],
      queryFn: ({ signal }) =>
        unwrap(api.GET("/api/v1/analytics/intake-hours", { params: { query: { range, timezone } }, signal })),
      placeholderData: keepPreviousData,
    }),

  topDoctors: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "patients-per-doctor", TOP_DOCTORS],
      queryFn: ({ signal }) =>
        unwrap(
          api.GET("/api/v1/analytics/patients-per-doctor", {
            params: { query: { limit: TOP_DOCTORS } },
            signal,
            ...context,
          }),
        ),
    }),

  criticalDoctors: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "patients-per-doctor", TOP_DOCTORS, "critical"],
      queryFn: ({ signal }) =>
        unwrap(
          api.GET("/api/v1/analytics/patients-per-doctor", {
            params: { query: { limit: TOP_DOCTORS, condition: "critical" } },
            signal,
            ...context,
          }),
        ),
    }),

  conditions: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "conditions"],
      queryFn: ({ signal }) => unwrap(api.GET("/api/v1/analytics/conditions", { signal, ...context })),
    }),

  conditionMix: (by: MixGroup, context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "condition-mix", by],
      queryFn: ({ signal }) =>
        unwrap(api.GET("/api/v1/analytics/condition-mix", { params: { query: { by } }, signal, ...context })),
      placeholderData: keepPreviousData,
    }),

  workload: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "workload"],
      queryFn: ({ signal }) => unwrap(api.GET("/api/v1/analytics/workload", { signal, ...context })),
    }),

  coverage: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "coverage"],
      queryFn: ({ signal }) => unwrap(api.GET("/api/v1/analytics/coverage", { signal, ...context })),
    }),

  diagnoses: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "diagnoses", ALL_DIAGNOSES],
      queryFn: ({ signal }) =>
        unwrap(
          api.GET("/api/v1/analytics/diagnoses", {
            params: { query: { limit: ALL_DIAGNOSES } },
            signal,
            ...context,
          }),
        ),
    }),

  /** Months are read in the visitor's time zone: browser only, like registrations. */
  diagnosisTrends: (diagnoses: string[], timezone: string) =>
    queryOptions({
      queryKey: [...key, "diagnosis-trends", diagnoses, timezone],
      queryFn: ({ signal }) =>
        unwrap(
          api.GET("/api/v1/analytics/diagnosis-trends", {
            params: { query: { diagnosis: diagnoses, timezone } },
            signal,
          }),
        ),
    }),

  demographics: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "demographics"],
      queryFn: ({ signal }) => unwrap(api.GET("/api/v1/analytics/demographics", { signal, ...context })),
    }),
};
