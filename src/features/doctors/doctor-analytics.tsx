"use client";

import { useQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";
import { ChartMark, ChartTip, TipRow, TipTitle, useChartTip } from "@/components/charts/chart-tip";
import { formatShare } from "@/components/charts/chart-format";
import { useRovingFocus } from "@/components/charts/use-roving-focus";
import { Skeleton } from "@/components/ui/skeleton";
import { BarList } from "@/features/dashboard/bar-list";
import { BOARD, Panel, QueryContent } from "@/features/dashboard/panel";
import { analyticsQueries } from "@/features/dashboard/queries";
import { ConditionBarTall, ConditionLegend, conditionParts } from "@/features/patients/condition-bar";
import { GENDER_LABELS } from "@/features/patients/conditions";
import type { Doctor, DoctorAnalytics } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { doctorQueries } from "./queries";

type Month = DoctorAnalytics["monthly"][number];

/** Months are calendar labels, so they're read as UTC to avoid sliding into the previous one. */
const monthDate = (month: string) => new Date(`${month}-01T00:00:00Z`);
const shortMonth = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const longMonth = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Twelve months of new patients, oldest first. The last month is still running, so it is
 * drawn lighter and said so, rather than read as a drop.
 */
function MonthlyColumns({ months }: { months: Month[] }) {
  const tip = useChartTip<Month & { current: boolean }>();
  const { onKeyDown, markProps } = useRovingFocus(months.length);
  const peak = Math.max(1, ...months.map((month) => month.patients));

  return (
    <div className="@container/cols flex flex-col gap-1.5">
      <div
        role="group"
        aria-label="New patients each month"
        onKeyDown={onKeyDown}
        className="flex h-40 items-stretch border-b"
      >
        {months.map((month, index) => {
          const current = index === months.length - 1;
          return (
            <ChartMark
              key={month.month}
              handle={tip}
              payload={{ ...month, current }}
              render={
                <div
                  {...markProps(index)}
                  aria-label={`${longMonth.format(monthDate(month.month))}${current ? ", so far" : ""}: ${formatNumber(month.patients)} new patients`}
                  className="group flex min-w-0 flex-1 cursor-default flex-col items-center justify-end rounded-t outline-none focus-visible:bg-muted"
                />
              }
            >
              <span aria-hidden="true" className="tabular mb-1 text-[0.6875rem] text-muted-foreground">
                {formatNumber(month.patients)}
              </span>
              <span
                style={{ height: `calc((100% - 1.25rem) * ${month.patients / peak})` }}
                className={cn(
                  "w-[min(1.5rem,70%)] rounded-t bg-data transition-opacity group-hover:opacity-80",
                  current && "opacity-40 group-hover:opacity-30",
                )}
              />
            </ChartMark>
          );
        })}
      </div>
      <div aria-hidden="true" className="flex text-[0.6875rem] text-muted-foreground">
        {months.map((month, index) => (
          <span
            key={month.month}
            // Every other month where the columns are too narrow for all twelve names.
            className={cn("min-w-0 flex-1 text-center", index % 2 === 1 && "invisible @xs/cols:visible")}
          >
            {shortMonth.format(monthDate(month.month))}
          </span>
        ))}
      </div>
      <ChartTip handle={tip}>
        {(month) => (
          <>
            <TipTitle>
              {longMonth.format(monthDate(month.month))}
              {month.current && ", so far"}
            </TipTitle>
            <TipRow value={formatNumber(month.patients)} label="new patients" />
          </>
        )}
      </ChartTip>
    </div>
  );
}

function monthlySummary(months: Month[]) {
  const total = months.reduce((sum, month) => sum + month.patients, 0);
  if (total === 0) return "No new patients in the last 12 months.";
  const complete = months.slice(0, -1);
  const average = complete.reduce((sum, month) => sum + month.patients, 0) / Math.max(1, complete.length);
  return `${formatNumber(total)} in the last 12 months, about ${formatNumber(Math.round(average))} a month. The lighter column is this month so far.`;
}

function genderLine(genders: DoctorAnalytics["genders"]) {
  const total = genders.reduce((sum, row) => sum + row.patients, 0);
  if (total === 0) return undefined;
  return genders
    .filter((row) => row.patients > 0)
    .toSorted((a, b) => b.patients - a.patients)
    .map((row) => `${formatPercent(row.patients / total)} ${GENDER_LABELS[row.gender].toLowerCase()}`)
    .join(", ");
}

function NoPatients({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed p-5 md:p-6">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
        <UsersIcon className="size-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-0.5">
        <h2 className="font-medium">Nothing to chart yet</h2>
        <p className="text-sm text-muted-foreground">
          {name} has no patients. Their condition mix, new patients each month and ages appear here
          once patients are assigned.
        </p>
      </div>
    </div>
  );
}

/** A doctor's own patients at a glance: condition, intake by month, and age. */
export function DoctorAnalyticsBoard({ doctor }: { doctor: Doctor }) {
  const hasPatients = doctor.patientCount > 0;
  // Months are counted in the visitor's own time zone.
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const analytics = useQuery({ ...doctorQueries.analytics(doctor.id, timezone), enabled: hasPatients });
  const clinic = useQuery(analyticsQueries.conditions());

  if (!hasPatients) return <NoPatients name={doctor.name} />;

  const { parts } = conditionParts(doctor.conditionCounts);
  const critical = parts.find((part) => part.value === "critical")!;
  const clinicTotal = clinic.data?.reduce((sum, row) => sum + row.patients, 0) ?? 0;
  const clinicCritical = clinic.data?.find((row) => row.condition === "critical")?.patients ?? 0;

  return (
    <section aria-label="Patient overview" className={`${BOARD} md:grid-cols-2 xl:grid-cols-3`}>
      <Panel
        title="Patients by condition"
        description={
          <>
            {formatNumber(critical.patients)} critical, {formatShare(critical.share)} of their patients
            {clinicTotal > 0 && `, against ${formatShare(clinicCritical / clinicTotal)} across the clinic`}.
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <ConditionBarTall counts={doctor.conditionCounts} label="Patients by condition" />
          <ConditionLegend counts={doctor.conditionCounts} />
        </div>
      </Panel>

      <Panel
        title="New patients each month"
        description={analytics.data ? monthlySummary(analytics.data.monthly) : "The last 12 months."}
        className="md:col-span-2 md:row-start-2 xl:col-span-1 xl:row-start-auto"
      >
        <QueryContent query={analytics} fallback={<Skeleton className="h-[12.125rem] w-full rounded-xl" />}>
          {(data) => <MonthlyColumns months={data.monthly} />}
        </QueryContent>
      </Panel>

      <Panel
        title="Ages"
        description={
          analytics.data && genderLine(analytics.data.genders)
            ? `Age in years. ${genderLine(analytics.data.genders)}.`
            : "Age in years at registration."
        }
      >
        <QueryContent query={analytics} fallback={<Skeleton className="h-[11.25rem] w-full rounded-xl" />}>
          {(data) => (
            <BarList
              compact
              unit="patients"
              items={data.ageGroups.map((row) => ({
                key: row.group,
                label: row.group.replace("-", "–"),
                value: row.patients,
              }))}
            />
          )}
        </QueryContent>
      </Panel>
    </section>
  );
}
