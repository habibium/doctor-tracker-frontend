"use client";

import Link from "next/link";
import { ChartMark, ChartTip, TipRow, TipTitle, useChartTip } from "@/components/charts/chart-tip";
import { useRovingFocus } from "@/components/charts/use-roving-focus";
import type { DiagnosisTrends } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { patientsWithDiagnosis } from "./diagnoses";

/** Months are 0-based, January first. */
export const WATCH = [
  {
    key: "dengue",
    title: "Dengue",
    season: [6, 7, 8, 9],
    seasonLabel: "July to October, with the monsoon",
    diagnoses: ["Dengue fever"],
  },
  {
    key: "waterborne",
    title: "Diarrhoea and typhoid",
    season: [3, 4, 5, 6, 7, 8],
    seasonLabel: "April to September, the hot and wet months",
    diagnoses: ["Acute watery diarrhoea", "Acute gastroenteritis", "Typhoid fever"],
  },
  {
    key: "respiratory",
    title: "Winter chest illness",
    season: [11, 0, 1],
    seasonLabel: "December to February, the dry winter",
    diagnoses: ["Pneumonia", "Bronchiolitis", "Asthma", "Childhood asthma", "COPD"],
  },
] as const;

export type WatchGroup = (typeof WATCH)[number];

export const WATCHED_DIAGNOSES = WATCH.flatMap((group) => [...group.diagnoses]);

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface Series {
  thisYear: number[];
  lastYear: number[];
}

export function groupSeries(data: DiagnosisTrends, diagnoses: readonly string[]): Series {
  const series = data.series.filter((row) => diagnoses.includes(row.diagnosis));
  const total = (pick: (row: (typeof series)[number]) => number[], length: number) =>
    Array.from({ length }, (_, month) => series.reduce((sum, row) => sum + (pick(row)[month] ?? 0), 0));
  return { thisYear: total((row) => row.thisYear, data.month), lastYear: total((row) => row.lastYear, 12) };
}

const upTo = (values: number[], month: number) => values.slice(0, month + 1).reduce((sum, value) => sum + value, 0);

function versus(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "with none a year before" : "as a year before";
  const change = (current - previous) / previous;
  if (Math.abs(change) < 0.005) return "level with a year before";
  return `${formatPercent(Math.abs(change))} ${change > 0 ? "above" : "below"} a year before`;
}

/**
 * Compares the last whole month and the year to date with the same span last year. The month
 * still running is left out of both, so a partial count never reads as a fall.
 */
export function seasonFinding(series: Series, month: number) {
  if (month === 1) {
    return `${formatNumber(series.thisYear[0] ?? 0)} so far this January, against ${formatNumber(series.lastYear[0] ?? 0)} in all of January last year.`;
  }
  const last = month - 2;
  const name = MONTH_NAMES[last]!;
  const current = series.thisYear[last] ?? 0;
  const before = series.lastYear[last] ?? 0;
  const parts = [`${formatNumber(current)} new patients in ${name}, ${versus(current, before)}.`];
  if (last > 0) {
    parts.push(
      `${formatNumber(upTo(series.thisYear, last))} since January, ${versus(upTo(series.thisYear, last), upTo(series.lastYear, last))}.`,
    );
  }
  return parts.join(" ");
}

/** All new patients, January to the last whole month, against the same months last year. */
export function baselineFinding(data: DiagnosisTrends) {
  if (data.month === 1) return "This year against last, month by month.";
  const last = data.month - 2;
  const current = upTo(data.allPatients.thisYear, last);
  const before = upTo(data.allPatients.lastYear, last);
  if (before === 0) return "This year against last, month by month.";
  const change = (current - before) / before;
  return `This year against last, month by month. All new patients from January to ${MONTH_NAMES[last]} are ${formatPercent(Math.abs(change))} ${change >= 0 ? "up" : "down"} on last year, so read a line against that, not against zero.`;
}

/** The first round number at or above the peak, with an even half for the middle gridline. */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return ([1, 1.2, 1.6, 2, 3, 4, 5, 6, 8, 10].find((step) => step * magnitude >= value) ?? 10) * magnitude;
}

const LAST_YEAR_INK = "color-mix(in oklab, var(--data) 50%, var(--card))";

interface Point {
  month: number;
  current?: number;
  previous: number;
  partial: boolean;
}

/**
 * Twelve months, January to December. This year is the data ink, last year the same ink
 * faded; the month still running ends in a dashed segment and an open dot. Shaded columns
 * are the months the illness usually peaks.
 */
export function SeasonChart({ series, year, group }: { series: Series; year: number; group: WatchGroup }) {
  const tip = useChartTip<Point>();
  const { onKeyDown, markProps } = useRovingFocus(12);
  const months = series.thisYear.length;
  const top = niceMax(Math.max(1, ...series.thisYear, ...series.lastYear));
  const x = (month: number) => ((month + 0.5) / 12) * 100;
  const y = (value: number) => 100 - (value / top) * 100;
  const line = (values: number[], from = 0) =>
    values.map((value, index) => `${index === 0 ? "M" : "L"}${x(from + index)} ${y(value)}`).join(" ");
  const season = new Set<number>(group.season);

  const complete = series.thisYear.slice(0, months - 1);
  const tail = series.thisYear.slice(Math.max(0, months - 2));

  const points: Point[] = series.lastYear.map((previous, month) => ({
    month,
    previous,
    current: series.thisYear[month],
    partial: month === months - 1,
  }));

  return (
    <figure className="@container/season flex flex-col gap-2">
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
        <div aria-hidden="true" className="relative h-36 text-right text-[0.6875rem] text-muted-foreground tabular">
          <span className="absolute top-0 right-0 -translate-y-1/2">{formatNumber(top)}</span>
          <span className="absolute top-1/2 right-0 -translate-y-1/2">{formatNumber(top / 2)}</span>
          <span className="absolute right-0 bottom-0 translate-y-1/2">0</span>
        </div>

        <div className="relative h-36">
          <div aria-hidden="true" className="absolute inset-0 flex">
            {points.map((point) => (
              <div key={point.month} className={cn("flex-1", season.has(point.month) && "bg-muted")} />
            ))}
          </div>
          <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-dashed" />
          <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed" />

          <div
            role="group"
            aria-label={`${group.title}: new patients each month, ${year} against ${year - 1}`}
            onKeyDown={onKeyDown}
            className="absolute inset-0 flex border-b"
          >
            {points.map((point, index) => (
              <ChartMark
                key={point.month}
                handle={tip}
                payload={point}
                render={
                  <div
                    {...markProps(index)}
                    aria-label={`${MONTH_NAMES[point.month]}: ${
                      point.current === undefined
                        ? "not yet"
                        : `${formatNumber(point.current)}${point.partial ? " so far" : ""} in ${year}`
                    }, ${formatNumber(point.previous)} in ${year - 1}`}
                    className="flex-1 cursor-default outline-none hover:bg-foreground/5 focus-visible:bg-foreground/10"
                  />
                }
              />
            ))}
          </div>

          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
          >
            <path d={line(series.lastYear)} fill="none" stroke={LAST_YEAR_INK} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            {complete.length > 1 && (
              <path
                d={line(complete)}
                fill="none"
                stroke="var(--data)"
                strokeWidth={2.25}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {tail.length === 2 && (
              <path
                d={line(tail, months - 2)}
                fill="none"
                stroke="var(--data)"
                strokeWidth={2.25}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {series.thisYear.map((value, month) => (
            <span
              key={month}
              aria-hidden="true"
              style={{ left: `${x(month)}%`, top: `${y(value)}%` }}
              className={cn(
                "pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                month === months - 1 ? "size-2 border-2 border-data bg-card" : "bg-data",
              )}
            />
          ))}
        </div>

        <div aria-hidden="true" className="col-start-2 mt-1.5 flex text-[0.6875rem] text-muted-foreground">
          {MONTH_NAMES.map((name) => (
            <span key={name} className="min-w-0 flex-1 text-center">
              <span className="@[17rem]/season:hidden">{name[0]}</span>
              <span className="hidden @[17rem]/season:inline">{name.slice(0, 3)}</span>
            </span>
          ))}
        </div>
      </div>

      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-data" />
          {year}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ backgroundColor: LAST_YEAR_INK }} />
          {year - 1}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-muted" />
          Usual season
        </span>
      </figcaption>

      <ChartTip handle={tip}>
        {(point) => (
          <>
            <TipTitle>
              {MONTH_NAMES[point.month]}
              {point.partial && ", so far"}
            </TipTitle>
            {point.current !== undefined && (
              <TipRow swatch="bg-data" value={formatNumber(point.current)} label={String(year)} />
            )}
            <TipRow swatch="bg-background/50" value={formatNumber(point.previous)} label={String(year - 1)} />
            {point.current !== undefined && !point.partial && point.previous > 0 && (
              <TipRow
                value={`${point.current >= point.previous ? "+" : "−"}${formatPercent(Math.abs(point.current - point.previous) / point.previous)}`}
                label="on a year before"
              />
            )}
          </>
        )}
      </ChartTip>
    </figure>
  );
}

export function WatchedDiagnoses({ group }: { group: WatchGroup }) {
  return (
    <p className="text-xs text-muted-foreground">
      {group.diagnoses.map((diagnosis, index) => (
        <span key={diagnosis}>
          {index > 0 && ", "}
          <Link
            href={patientsWithDiagnosis(diagnosis)}
            className="underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground hover:decoration-foreground"
          >
            {diagnosis}
          </Link>
        </span>
      ))}
      . Usual season: {group.seasonLabel}.
    </p>
  );
}
