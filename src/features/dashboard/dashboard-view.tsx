"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { formatShare } from "@/components/charts/chart-format";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GENDER_LABELS } from "@/features/patients/conditions";
import { formatNumber } from "@/lib/format";
import { BarList } from "./bar-list";
import { AgeChart, RegistrationsChart } from "./charts";
import { ConditionCensus } from "./condition-census";
import { ConditionMixPanel } from "./condition-mix";
import { IntakeHeatmap, intakeFinding, toGrid } from "./intake-heatmap";
import { BOARD, Panel, QueryContent, Section, useNearViewport } from "./panel";
import { analyticsQueries, type Range, rangeParam, RANGES } from "./queries";
import { Delta, StatTile } from "./stat-tile";
import { WorkloadChart, workloadFinding } from "./workload-chart";

function Overview() {
  const conditions = useQuery(analyticsQueries.conditions());
  const summary = useQuery(analyticsQueries.summary("30d"));
  const specializations = useQuery(analyticsQueries.conditionMix("specialization"));
  const topDoctors = useQuery(analyticsQueries.topDoctors());

  const totals = summary.data;
  const busiest = topDoctors.data?.[0];

  return (
    <Section
      title="Patients and their condition"
      description="How many patients are in our care, and how they are doing."
    >
      <div className={`${BOARD} sm:grid-cols-3`}>
        <div className="bg-card p-5 sm:col-span-3 md:p-6">
          <QueryContent query={conditions} fallback={<Skeleton className="h-44 w-full rounded-xl" />}>
            {(breakdown) => <ConditionCensus breakdown={breakdown} />}
          </QueryContent>
        </div>

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
              ? `${formatShare(totals.criticalPatients / totals.totalPatients)} of patients in care`
              : undefined
          }
        />
      </div>
    </Section>
  );
}

function Workload() {
  const workload = useQuery(analyticsQueries.workload());
  const topDoctors = useQuery(analyticsQueries.topDoctors());

  return (
    <Section title="Workload" description="How evenly patients are spread, and who carries the most.">
      <div className={`${BOARD} lg:grid-cols-2`}>
        <Panel
          title="Patients per doctor"
          description={workload.data ? workloadFinding(workload.data) : "How the patient load is spread."}
        >
          <QueryContent query={workload} fallback={<Skeleton className="h-[19rem] w-full rounded-xl" />}>
            {(data) => <WorkloadChart data={data} />}
          </QueryContent>
        </Panel>

        <Panel title="Busiest doctors" description="The doctors with the most patients in their care.">
          <QueryContent query={topDoctors} fallback={<Skeleton className="h-[23.25rem] w-full rounded-xl" />}>
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
      </div>
    </Section>
  );
}

function Critical() {
  const criticalDoctors = useQuery(analyticsQueries.criticalDoctors());

  return (
    <Section
      title="Critical patients"
      description="Where the critical patients are, and which doctors look after the most of them."
    >
      <div className={`${BOARD} lg:grid-cols-3`}>
        <ConditionMixPanel className="lg:col-span-2" />
        <Panel
          title="Most critical patients"
          description="Doctors with the most patients in critical condition."
        >
          <QueryContent
            query={criticalDoctors}
            fallback={<Skeleton className="h-[23.25rem] w-full rounded-xl" />}
          >
            {(doctors) =>
              doctors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No patient is in critical condition.</p>
              ) : (
                <BarList
                  unit="critical patients"
                  fill="bg-condition-critical"
                  items={doctors.map((doctor) => ({
                    key: doctor.doctorId,
                    label: doctor.name,
                    detail: `${doctor.specialization}, ${doctor.hospital}`,
                    value: doctor.patients,
                    href: `/doctors/${doctor.doctorId}`,
                  }))}
                />
              )
            }
          </QueryContent>
        </Panel>
      </div>
    </Section>
  );
}

function RangeToggle({ value, onChange }: { value: Range; onChange: (range: Range) => void }) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={0}
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

function Arrivals() {
  const [range, setRange] = useQueryState("range", rangeParam);
  const { period } = RANGES.find((item) => item.value === range) ?? RANGES[1]!;
  // Below the fold on most screens: the two browser-only requests wait until it's close.
  const [ref, near] = useNearViewport<HTMLElement>();

  // Days and hours are read in the visitor's own time zone.
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const summary = useQuery(analyticsQueries.summary(range));
  const registrations = useQuery({ ...analyticsQueries.registrations(range, timezone), enabled: near });
  const intake = useQuery({ ...analyticsQueries.intakeHours(range, timezone), enabled: near });

  const totals = summary.data;
  const dimmed = summary.isPlaceholderData ? "opacity-60" : undefined;

  return (
    <Section
      ref={ref}
      title="Arrivals"
      description={`When new patients register, and whether intake is growing. Showing ${period}.`}
      action={<RangeToggle value={range} onChange={(next) => void setRange(next)} />}
    >
      <div className={`${BOARD} lg:grid-cols-4`}>
        <Panel
          title="New patients"
          description={
            range === "12m"
              ? "Registered each month. This month is still in progress."
              : "Registered each day. Today is still in progress."
          }
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

        <Panel
          title="When patients arrive"
          description={
            intake.data
              ? intakeFinding(toGrid(intake.data.cells), period)
              : "New patients by weekday and hour of registration."
          }
          className="lg:col-span-4"
        >
          <QueryContent
            query={intake}
            fallback={
              // The heatmap turns on its side in narrow panels, so its placeholder does too.
              <div className="@container">
                <Skeleton className="h-[32rem] w-full rounded-xl @xl:h-[18.5rem]" />
              </div>
            }
          >
            {(data) => <IntakeHeatmap data={data} timezone={timezone} />}
          </QueryContent>
        </Panel>
      </div>
    </Section>
  );
}

function Patients() {
  const demographics = useQuery(analyticsQueries.demographics());

  return (
    <Section title="Who our patients are" description="Age and gender of everyone in care.">
      <div className={`${BOARD} lg:grid-cols-3`}>
        <Panel title="Patients by age" description="Age in years at registration." className="lg:col-span-2">
          <QueryContent query={demographics} fallback={<Skeleton className="h-56 w-full rounded-xl" />}>
            {(data) => <AgeChart data={data.ageGroups} />}
          </QueryContent>
        </Panel>

        <Panel title="Patients by gender">
          <QueryContent query={demographics} fallback={<Skeleton className="h-[5.25rem] w-full rounded-xl" />}>
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
    </Section>
  );
}

export function DashboardView() {
  return (
    <div className="flex flex-col gap-10">
      <Overview />
      <Workload />
      <Critical />
      <Arrivals />
      <Patients />
    </div>
  );
}

/** The dashboard's outline, shown while its numbers are on the way. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10" role="status" aria-label="Loading dashboard">
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-[48rem] rounded-2xl" />
    </div>
  );
}
