"use client";

import { type CSSProperties, type KeyboardEvent, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { ChartMark, ChartTip, TipRow, TipTitle, useChartTip } from "@/components/charts/chart-tip";
import { TableView, TD, TH } from "@/components/charts/table-view";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SpecializationIcon } from "@/features/doctors/specialization";
import type { Coverage } from "@/lib/api";
import { formatCompact, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Panel, QueryContent } from "./panel";
import { analyticsQueries, COVERAGE_METRICS, type CoverageMetric, coverageParam } from "./queries";

/** Column labels that fit a 3.5rem column; the full name is in the tooltip and the accessible name. */
const SHORT_NAMES: Record<string, string> = {
  "General Medicine": "Medicine",
  Cardiology: "Cardio",
  Pediatrics: "Peds",
  "Gynecology & Obstetrics": "Gyn & Obs",
  Orthopedics: "Ortho",
  Endocrinology: "Endo",
  Gastroenterology: "Gastro",
  Neurology: "Neuro",
  Pulmonology: "Pulmo",
  Nephrology: "Nephro",
  Dermatology: "Derm",
  Oncology: "Onco",
  Psychiatry: "Psych",
  Ophthalmology: "Eye",
};
const shortName = (name: string) => SHORT_NAMES[name] ?? name.split(/\s+/)[0]!.slice(0, 7);

const LEVELS = 4;
/** Share of the data ink in each class; a gap has no fill at all, only a dashed outline. */
const MIX = [0, 20, 42, 64, 86];
const levelColor = (level: number) => `color-mix(in oklab, var(--data) ${MIX[level]}%, var(--card))`;

interface Totals {
  doctors: number;
  patients: number;
}

const METRIC_VALUE: Record<CoverageMetric, (totals: Totals) => number> = {
  doctors: (totals) => totals.doctors,
  patients: (totals) => totals.patients,
  load: (totals) => (totals.doctors > 0 ? totals.patients / totals.doctors : 0),
};

function formatMetric(metric: CoverageMetric, value: number, compact = false) {
  if (metric === "load") return formatNumber(Math.round(value));
  return compact && value >= 1000 ? formatCompact(value) : formatNumber(value);
}

const plural = (count: number, one: string, many = `${one}s`) =>
  `${formatNumber(count)} ${count === 1 ? one : many}`;

function listNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

const doctorsHref = (filters: { hospital?: string; specialization?: string }) =>
  `/doctors?${new URLSearchParams({ ...filters, sort: "-patientCount" })}`;

interface Grid {
  hospitals: Coverage["hospitals"];
  specializations: Coverage["specializations"];
  cell: (hospital: string, specialization: string) => Totals | undefined;
  overall: Totals;
}

function toGrid(data: Coverage): Grid {
  const cells = new Map(data.cells.map((cell) => [`${cell.hospital}\n${cell.specialization}`, cell]));
  return {
    hospitals: data.hospitals,
    specializations: data.specializations,
    cell: (hospital, specialization) => cells.get(`${hospital}\n${specialization}`),
    overall: {
      doctors: data.hospitals.reduce((sum, row) => sum + row.doctors, 0),
      patients: data.hospitals.reduce((sum, row) => sum + row.patients, 0),
    },
  };
}

/** Where the gaps are, and for the per-doctor view, which staffed pair is stretched thinnest. */
export function coverageFinding(data: Coverage, metric: CoverageMetric) {
  const hospitals = data.hospitals.length;
  const pairs = hospitals * data.specializations.length;
  if (pairs === 0) return "No doctors on the roster yet.";

  const gaps = pairs - data.cells.length;
  const thinnest = data.specializations.toSorted((a, b) => a.hospitals - b.hospitals || a.doctors - b.doctors)[0]!;
  const everywhere = data.specializations.filter((row) => row.hospitals === hospitals).map((row) => row.name);

  const parts =
    gaps === 0
      ? ["Every hospital has every specialization."]
      : [
          `${formatNumber(gaps)} of the ${formatNumber(pairs)} hospital and specialization pairs have no doctor.`,
          `${thinnest.name} is the thinnest, at ${thinnest.hospitals} of ${hospitals} hospitals${
            everywhere.length > 0
              ? `; ${listNames(everywhere)} ${everywhere.length === 1 ? "is" : "are"} at every one.`
              : "."
          }`,
        ];

  if (metric === "load") {
    const average = METRIC_VALUE.load(toGrid(data).overall);
    const stretched = data.cells.toSorted((a, b) => b.patients / b.doctors - a.patients / a.doctors)[0];
    if (stretched) {
      parts.push(
        `Most stretched: ${stretched.specialization} at ${stretched.hospital}, ${formatNumber(Math.round(stretched.patients / stretched.doctors))} patients per doctor against ${formatNumber(Math.round(average))} across the clinic.`,
      );
    }
  }
  return parts.join(" ");
}

type Tip = { hospital: string; specialization: Coverage["specializations"][number]; totals?: Totals };

/**
 * Hospitals down, specializations across, most doctors first both ways, so gaps gather at the
 * bottom right. Narrow panels keep each hospital's row but stack its name over a strip of cells,
 * and name the missing specializations in words.
 */
export function CoverageMatrix({ data, metric }: { data: Coverage; metric: CoverageMetric }) {
  const tip = useChartTip<Tip>();
  const grid = toGrid(data);
  const [active, setActive] = useState({ row: 0, col: 0 });
  const value = METRIC_VALUE[metric];

  const values = data.cells.map(value);
  const max = Math.max(1, ...values);
  const level = (totals: Totals | undefined) =>
    totals && totals.doctors > 0 ? Math.max(1, Math.ceil((value(totals) / max) * LEVELS)) : 0;
  const average = value(grid.overall);

  const rows = grid.hospitals.length;
  const cols = grid.specializations.length;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = { ...active };
    if (event.key === "ArrowRight") next.col = Math.min(cols - 1, next.col + 1);
    else if (event.key === "ArrowLeft") next.col = Math.max(0, next.col - 1);
    else if (event.key === "ArrowDown") next.row = Math.min(rows - 1, next.row + 1);
    else if (event.key === "ArrowUp") next.row = Math.max(0, next.row - 1);
    else if (event.key === "Home") next.col = 0;
    else if (event.key === "End") next.col = cols - 1;
    else return;
    event.preventDefault();
    setActive(next);
    event.currentTarget.querySelector<HTMLElement>(`[data-cell="${next.row}-${next.col}"]`)?.focus();
  };

  const legend = Array.from({ length: LEVELS }, (_, index) => {
    const low = index === 0 ? (metric === "load" ? 0 : 1) : Math.floor((index / LEVELS) * max) + 1;
    const high = Math.floor(((index + 1) / LEVELS) * max);
    return { level: index + 1, label: low >= high ? formatMetric(metric, high, true) : `${formatMetric(metric, low, true)}–${formatMetric(metric, high, true)}` };
  });
  const unit = metric === "doctors" ? "doctors" : metric === "patients" ? "patients" : "patients per doctor";

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/cover">
        <div
          role="grid"
          aria-label={`${COVERAGE_METRICS.find((item) => item.value === metric)?.label} by hospital and specialization`}
          onKeyDown={onKeyDown}
          className="flex flex-col gap-4 @[34rem]/cover:grid @[34rem]/cover:grid-cols-[minmax(7rem,min(13rem,22%))_repeat(var(--cols),minmax(0,1fr))_3.5rem] @[34rem]/cover:items-center @[34rem]/cover:gap-0.5"
          style={{ "--cols": cols } as CSSProperties}
        >
          <div
            role="row"
            className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-0.5 @[34rem]/cover:contents"
          >
            <span role="columnheader" className="hidden text-xs text-muted-foreground @[34rem]/cover:block @[34rem]/cover:self-end @[34rem]/cover:pb-1">
              Hospital
            </span>
            {grid.specializations.map((specialization) => (
              <Link
                key={specialization.name}
                role="columnheader"
                href={doctorsHref({ specialization: specialization.name })}
                title={`${specialization.name}: ${plural(specialization.doctors, "doctor")} at ${specialization.hospitals} of ${rows} hospitals`}
                className="flex min-w-0 flex-col items-center gap-1 self-end rounded-md pb-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SpecializationIcon name={specialization.name} className="size-4 shrink-0" />
                <span aria-hidden="true" className="hidden text-center text-[0.6875rem] leading-tight @4xl/cover:block">
                  {shortName(specialization.name)}
                </span>
                <span className="sr-only">{specialization.name}</span>
              </Link>
            ))}
            <span role="columnheader" className="hidden pb-1 text-right text-xs text-muted-foreground @[34rem]/cover:block @[34rem]/cover:self-end">
              All
            </span>
          </div>

          {grid.hospitals.map((hospital, row) => {
            const missing = grid.specializations
              .filter((specialization) => !grid.cell(hospital.name, specialization.name))
              .map((specialization) => specialization.name);
            return (
              <div
                key={hospital.name}
                role="row"
                className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] items-center gap-0.5 @[34rem]/cover:contents"
              >
                <Link
                  role="rowheader"
                  href={doctorsHref({ hospital: hospital.name })}
                  title={hospital.name}
                  className="col-[1/-5] row-start-1 truncate pb-1 text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:underline @[34rem]/cover:col-span-1 @[34rem]/cover:row-start-auto @[34rem]/cover:pr-2 @[34rem]/cover:pb-0 @[34rem]/cover:font-normal"
                >
                  {hospital.name}
                </Link>
                {grid.specializations.map((specialization, col) => {
                  const totals = grid.cell(hospital.name, specialization.name);
                  const cellLevel = level(totals);
                  const isActive = active.row === row && active.col === col;
                  const label = totals
                    ? `${hospital.name}, ${specialization.name}: ${plural(totals.doctors, "doctor")}, ${plural(totals.patients, "patient")}`
                    : `${hospital.name}, ${specialization.name}: no doctor`;
                  const common = {
                    role: "gridcell",
                    "data-cell": `${row}-${col}`,
                    tabIndex: isActive ? 0 : -1,
                    "aria-label": label,
                    onFocus: () => setActive({ row, col }),
                    style: totals ? { backgroundColor: levelColor(cellLevel) } : undefined,
                    className: cn(
                      "flex h-6 min-w-0 items-center justify-center rounded-[4px] text-[0.6875rem] tabular outline-none hover:ring-2 hover:ring-foreground focus-visible:ring-2 focus-visible:ring-foreground @[34rem]/cover:h-8 @[34rem]/cover:text-xs",
                      totals ? "cursor-pointer" : "cursor-default border border-dashed border-muted-foreground/45",
                      cellLevel === LEVELS && "dark:text-card",
                    ),
                  };
                  return (
                    <ChartMark
                      key={specialization.name}
                      handle={tip}
                      payload={{ hospital: hospital.name, specialization, totals }}
                      render={
                        totals ? (
                          <Link href={doctorsHref({ hospital: hospital.name, specialization: specialization.name })} {...common} />
                        ) : (
                          <div {...common} />
                        )
                      }
                    >
                      {totals && (
                        <span
                          aria-hidden="true"
                          className={cn("hidden", metric === "patients" ? "@4xl/cover:inline" : "@[34rem]/cover:inline")}
                        >
                          {formatMetric(metric, value(totals), true)}
                        </span>
                      )}
                    </ChartMark>
                  );
                })}
                <span className="col-[-5/-1] row-start-1 pb-1 text-right text-sm tabular text-muted-foreground @[34rem]/cover:col-span-1 @[34rem]/cover:row-start-auto @[34rem]/cover:pb-0 @[34rem]/cover:text-foreground">
                  {formatMetric(metric, value(hospital), true)}
                  <span className="sr-only"> {unit} in all</span>
                </span>
                <p className="col-span-full pt-1 text-xs text-muted-foreground @[34rem]/cover:hidden">
                  {missing.length === 0 ? "Every specialization." : `No ${listNames(missing)}.`}
                </p>
              </div>
            );
          })}

          <div role="row" className="hidden @[34rem]/cover:contents">
            <span role="rowheader" className="pt-1 text-xs text-muted-foreground">
              All hospitals
            </span>
            {grid.specializations.map((specialization) => (
              <span key={specialization.name} role="gridcell" className="pt-1 text-center text-xs tabular text-muted-foreground">
                {formatMetric(metric, value(specialization), true)}
              </span>
            ))}
            <span role="gridcell" className="pt-1 text-right text-sm font-medium tabular">
              {formatMetric(metric, average, true)}
            </span>
          </div>
        </div>

        {/* Icons alone head the columns below the widest layout, so name them once here. */}
        <ul
          aria-hidden="true"
          className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground @4xl/cover:hidden"
        >
          {grid.specializations.map((specialization) => (
            <li key={specialization.name} className="flex items-center gap-1">
              <SpecializationIcon name={specialization.name} className="size-3.5 shrink-0" />
              {shortName(specialization.name)}
            </li>
          ))}
        </ul>
      </div>

      <figure className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <figcaption className="sr-only">Legend</figcaption>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            {metric === "doctors" ? "Doctors" : metric === "patients" ? "Patients" : "Patients per doctor"} in a
            pair
          </span>
          <div className="flex gap-0.5" aria-hidden="true">
            <div className="flex w-12 flex-col gap-1">
              <span className="h-3 rounded-[3px] border border-dashed border-muted-foreground/45" />
              <span className="text-[0.6875rem] text-muted-foreground">None</span>
            </div>
            {legend.map((step) => (
              <div key={step.level} className="flex w-12 flex-col gap-1">
                <span className="h-3 rounded-[3px]" style={{ backgroundColor: levelColor(step.level) }} />
                <span className="tabular text-[0.6875rem] text-muted-foreground">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Totals: {plural(grid.overall.doctors, "doctor")} and {plural(grid.overall.patients, "patient")}. Select a
          cell to see its doctors.
        </p>
      </figure>

      <TableView>
        <table>
          <caption className="sr-only">
            {unit} by hospital and specialization
          </caption>
          <thead>
            <tr>
              <th scope="col" className={TH}>
                Hospital
              </th>
              {grid.specializations.map((specialization) => (
                <th key={specialization.name} scope="col" className={cn(TH, "text-right")}>
                  {specialization.name}
                </th>
              ))}
              <th scope="col" className={cn(TH, "text-right")}>
                All
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.hospitals.map((hospital) => (
              <tr key={hospital.name}>
                <th scope="row" className={cn(TD, "text-left font-normal")}>
                  {hospital.name}
                </th>
                {grid.specializations.map((specialization) => {
                  const totals = grid.cell(hospital.name, specialization.name);
                  return (
                    <td key={specialization.name} className={cn(TD, !totals && "text-muted-foreground")}>
                      {totals ? formatMetric(metric, value(totals)) : "–"}
                    </td>
                  );
                })}
                <td className={cn(TD, "font-medium")}>{formatMetric(metric, value(hospital))}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className={cn(TD, "text-left font-medium")}>
                All hospitals
              </th>
              {grid.specializations.map((specialization) => (
                <td key={specialization.name} className={cn(TD, "font-medium")}>
                  {formatMetric(metric, value(specialization))}
                </td>
              ))}
              <td className={cn(TD, "font-medium")}>{formatMetric(metric, average)}</td>
            </tr>
          </tbody>
        </table>
      </TableView>

      <ChartTip handle={tip}>
        {({ hospital, specialization, totals }) => (
          <>
            <TipTitle>
              {specialization.name} at {hospital}
            </TipTitle>
            {totals ? (
              <>
                <TipRow value={formatNumber(totals.doctors)} label={totals.doctors === 1 ? "doctor" : "doctors"} />
                <TipRow value={formatNumber(totals.patients)} label="patients" />
                <TipRow
                  value={formatNumber(Math.round(totals.patients / totals.doctors))}
                  label={`per doctor; ${formatNumber(Math.round(METRIC_VALUE.load(grid.overall)))} across the clinic`}
                />
              </>
            ) : (
              <>
                <TipRow value="No" label="doctor here" />
                <TipRow
                  value={`${specialization.hospitals} of ${rows}`}
                  label={`hospitals have ${specialization.name}`}
                />
              </>
            )}
          </>
        )}
      </ChartTip>
    </div>
  );
}

export function CoveragePanel() {
  const [metric, setMetric] = useQueryState("coverage", coverageParam);
  const query = useQuery(analyticsQueries.coverage());

  return (
    <Panel
      title="Specialists by hospital"
      description={query.data ? coverageFinding(query.data, metric) : "Which specializations each hospital has."}
      action={
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Show"
          value={[metric]}
          onValueChange={(next) => {
            const value = next[0] as CoverageMetric | undefined;
            if (value) void setMetric(value);
          }}
        >
          {COVERAGE_METRICS.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
    >
      <QueryContent query={query} fallback={<CoverageSkeleton />}>
        {(data) => <CoverageMatrix data={data} metric={metric} />}
      </QueryContent>
    </Panel>
  );
}

function CoverageSkeleton() {
  return (
    <div className="@container">
      <Skeleton className="h-[88rem] w-full rounded-xl @[34rem]:h-[40.25rem] @4xl:h-[37.0625rem]" />
    </div>
  );
}
