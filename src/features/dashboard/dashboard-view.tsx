"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GENDER_LABELS } from "@/features/patients/conditions";
import { formatNumber, formatPercent } from "@/lib/format";
import { BarList } from "./bar-list";
import { AgeChart, RegistrationsChart } from "./charts";
import { ConditionCensus } from "./condition-census";
import { Panel, QueryContent } from "./panel";
import { analyticsQueries, type Range, rangeParam, RANGES } from "./queries";
import { Delta, StatTile } from "./stat-tile";

/**
 * Cells sit on a 1px grid gap over the border colour, which draws a hairline between
 * every pair of neighbours however the grid wraps.
 */
const BOARD = "grid gap-px overflow-hidden rounded-2xl border bg-border";

const SPECIALIZATION_ROWS = 8;

function Snapshot() {
  const conditions = useQuery(analyticsQueries.conditions());
  const summary = useQuery(analyticsQueries.summary("30d"));
  const specializations = useQuery(analyticsQueries.specializations());
  const topDoctors = useQuery(analyticsQueries.topDoctors());

  const totals = summary.data;
  const busiest = topDoctors.data?.[0];

  return (
    <div className={`${BOARD} sm:grid-cols-3`}>
      <section className="bg-card p-5 sm:col-span-3 md:p-6">
        <QueryContent query={conditions} fallback={<Skeleton className="h-44 w-full rounded-xl" />}>
          {(breakdown) => <ConditionCensus breakdown={breakdown} />}
        </QueryContent>
      </section>

      <StatTile
        label="Doctors"
        value={totals ? formatNumber(totals.totalDoctors) : <Skeleton className="h-9 w-20" />}
        detail={
          specializations.data && `Across ${specializations.data.length} specializations`
        }
      />
      <StatTile
        label="Patients per doctor"
        value={
          totals ? formatNumber(totals.averagePatientsPerDoctor) : <Skeleton className="h-9 w-20" />
        }
        detail={busiest && `On average. The busiest has ${formatNumber(busiest.patients)}.`}
      />
      <StatTile
        label="Critical patients"
        value={totals ? formatNumber(totals.criticalPatients) : <Skeleton className="h-9 w-20" />}
        detail={
          totals && totals.totalPatients > 0
            ? `${formatPercent(totals.criticalPatients / totals.totalPatients)} of patients in care`
            : undefined
        }
      />
    </div>
  );
}

function RangeToggle({ value, onChange }: { value: Range; onChange: (range: Range) => void }) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      aria-label="Period"
      value={[value]}
      onValueChange={(next) => {
        const range = next[0] as Range | undefined;
        if (range) onChange(range);
      }}
    >
      {RANGES.map((range) => (
        <ToggleGroupItem key={range.value} value={range.value}>
          {range.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function Registrations() {
  const [range, setRange] = useQueryState("range", rangeParam);
  const { period } = RANGES.find((item) => item.value === range) ?? RANGES[1]!;

  // Days are counted in the visitor's own time zone.
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const summary = useQuery(analyticsQueries.summary(range));
  const registrations = useQuery(analyticsQueries.registrations(range, timezone));

  const totals = summary.data;
  const dimmed = summary.isPlaceholderData ? "opacity-60" : undefined;

  return (
    <div className={`${BOARD} lg:grid-cols-4`}>
      <Panel
        title="New patients"
        description={
          range === "12m"
            ? "Registered each month. This month is still in progress."
            : "Registered each day. Today is still in progress."
        }
        action={<RangeToggle value={range} onChange={(next) => void setRange(next)} />}
        className="lg:col-span-3 lg:row-span-2"
      >
        <QueryContent query={registrations} fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
          {(data) => <RegistrationsChart data={data} />}
        </QueryContent>
      </Panel>

      <StatTile
        className={dimmed}
        label={`New patients in ${period}`}
        value={totals ? formatNumber(totals.newPatients) : <Skeleton className="h-9 w-24" />}
        detail={
          totals && (
            <Delta
              current={totals.newPatients}
              previous={totals.previousNewPatients}
              period={`the ${period.replace("the last ", "")} before`}
            />
          )
        }
      />
      <StatTile
        className={dimmed}
        label={`Doctors who joined in ${period}`}
        value={totals ? formatNumber(totals.newDoctors) : <Skeleton className="h-9 w-16" />}
      />
    </div>
  );
}

function Breakdown() {
  const topDoctors = useQuery(analyticsQueries.topDoctors());
  const specializations = useQuery(analyticsQueries.specializations());
  const demographics = useQuery(analyticsQueries.demographics());

  const listFallback = <Skeleton className="h-72 w-full rounded-xl" />;

  return (
    <>
    <div className={`${BOARD} lg:grid-cols-2`}>
      <Panel title="Busiest doctors" description="The doctors with the most patients in their care.">
        <QueryContent query={topDoctors} fallback={listFallback}>
          {(doctors) => (
            <BarList
              unit="patients"
              items={doctors.map((doctor) => ({
                key: doctor.doctorId,
                label: doctor.name,
                detail: doctor.specialization,
                value: doctor.patients,
                href: `/doctors/${doctor.doctorId}`,
              }))}
            />
          )}
        </QueryContent>
      </Panel>

      <Panel title="Patients by specialization" description="Where the patient load sits.">
        <QueryContent query={specializations} fallback={listFallback}>
          {(rows) => {
            const shown = rows.slice(0, SPECIALIZATION_ROWS);
            const rest = rows.slice(SPECIALIZATION_ROWS);
            return (
              <div className="flex flex-col gap-4">
                <BarList
                  unit="patients"
                  items={shown.map((row) => ({
                    key: row.specialization,
                    label: row.specialization,
                    detail: `${formatNumber(row.doctors)} doctors`,
                    value: row.patients,
                  }))}
                />
                {/* The tail is summed in words: as a bar it would dwarf every real row. */}
                {rest.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {rest.length} smaller specializations hold another{" "}
                    {formatNumber(rest.reduce((sum, row) => sum + row.patients, 0))} patients.
                  </p>
                )}
              </div>
            );
          }}
        </QueryContent>
      </Panel>

    </div>

    <div className={`${BOARD} lg:grid-cols-3`}>
      <Panel
        title="Patients by age"
        description="Age in years at registration."
        className="lg:col-span-2"
      >
        <QueryContent query={demographics} fallback={<Skeleton className="h-56 w-full rounded-xl" />}>
          {(data) => <AgeChart data={data.ageGroups} />}
        </QueryContent>
      </Panel>

      <Panel title="Patients by gender">
        <QueryContent query={demographics} fallback={<Skeleton className="h-24 w-full rounded-xl" />}>
          {(data) => (
            <BarList
              compact
              unit="patients"
              items={data.genders.map((row) => ({
                key: row.gender,
                label: GENDER_LABELS[row.gender],
                value: row.patients,
              }))}
            />
          )}
        </QueryContent>
      </Panel>
    </div>
    </>
  );
}

export function DashboardView() {
  return (
    <div className="flex flex-col gap-6">
      <Snapshot />
      <Registrations />
      <Breakdown />
    </div>
  );
}

/** The dashboard's outline, shown while its numbers are on the way. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading dashboard">
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
