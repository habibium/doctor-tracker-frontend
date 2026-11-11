import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { parseAsStringLiteral } from "nuqs/server";
import {
  type ApiContext,
  getAnalyticsSummary,
  getConditionBreakdown,
  getConditionMix,
  getDemographics,
  getIntakeHours,
  getPatientsPerDoctor,
  getRegistrations,
  getWorkload,
  type Registrations,
} from "@/lib/api";
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

const key = queryKeys.analytics;

/** `context` is only passed on the server, to forward the session cookie. */
export const analyticsQueries = {
  summary: (range: Range, context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "summary", range],
      queryFn: async ({ signal }) =>
        (await getAnalyticsSummary({ query: { range }, signal, throwOnError: true, ...context }))
          .data,
      placeholderData: keepPreviousData,
    }),

  /** Days are grouped in the visitor's time zone, so this one is fetched by the browser. */
  registrations: (range: Range, timezone: string) =>
    queryOptions({
      queryKey: [...key, "registrations", range, timezone],
      queryFn: async ({ signal }) =>
        (await getRegistrations({ query: { range, timezone }, signal, throwOnError: true })).data,
      placeholderData: keepPreviousData,
    }),

  /** Weekday and hour are read in the visitor's time zone: browser only, like registrations. */
  intakeHours: (range: Range, timezone: string) =>
    queryOptions({
      queryKey: [...key, "intake-hours", range, timezone],
      queryFn: async ({ signal }) =>
        (await getIntakeHours({ query: { range, timezone }, signal, throwOnError: true })).data,
      placeholderData: keepPreviousData,
    }),

  topDoctors: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "patients-per-doctor", TOP_DOCTORS],
      queryFn: async ({ signal }) =>
        (
          await getPatientsPerDoctor({
            query: { limit: TOP_DOCTORS },
            signal,
            throwOnError: true,
            ...context,
          })
        ).data,
    }),

  criticalDoctors: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "patients-per-doctor", TOP_DOCTORS, "critical"],
      queryFn: async ({ signal }) =>
        (
          await getPatientsPerDoctor({
            query: { limit: TOP_DOCTORS, condition: "critical" },
            signal,
            throwOnError: true,
            ...context,
          })
        ).data,
    }),

  conditions: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "conditions"],
      queryFn: async ({ signal }) =>
        (await getConditionBreakdown({ signal, throwOnError: true, ...context })).data,
    }),

  conditionMix: (by: MixGroup, context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "condition-mix", by],
      queryFn: async ({ signal }) =>
        (await getConditionMix({ query: { by }, signal, throwOnError: true, ...context })).data,
      placeholderData: keepPreviousData,
    }),

  workload: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "workload"],
      queryFn: async ({ signal }) =>
        (await getWorkload({ signal, throwOnError: true, ...context })).data,
    }),

  demographics: (context?: ApiContext) =>
    queryOptions({
      queryKey: [...key, "demographics"],
      queryFn: async ({ signal }) =>
        (await getDemographics({ signal, throwOnError: true, ...context })).data,
    }),
};
