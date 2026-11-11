"use client";

import { type CSSProperties, type KeyboardEvent, useState } from "react";
import { ChartMark, ChartTip, TipRow, TipTitle, useChartTip } from "@/components/charts/chart-tip";
import { formatHour, WEEKDAYS } from "@/components/charts/chart-format";
import type { IntakeHours } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
/** Sunday first: the Bangladesh working week runs Sunday to Thursday (CLDR's first day for BD). */
const DAYS = [0, 1, 2, 3, 4, 5, 6];
const LEVELS = 5;
/** Share of the data ink mixed into the card for each class; zero stays nearly blank. */
const MIX = [6, 24, 42, 60, 78, 96];
/** Swatch for a class, in CSS so it follows the theme. Oklab, because a near-grey ink has no stable hue to interpolate. */
const levelColor = (level: number) =>
  `color-mix(in oklab, var(--data) ${MIX[level]}%, var(--card))`;

/** Lower bounds of the five classes above zero, on round numbers that reach `max`. */
function classBounds(max: number) {
  const rough = Math.max(1, max / LEVELS);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const width = ([1, 2, 5, 10].find((factor) => factor * magnitude >= rough) ?? 10) * magnitude;
  return Array.from({ length: LEVELS }, (_, index) => (width === 1 ? index + 1 : Math.max(1, index * width)));
}

interface Cell {
  weekday: number;
  hour: number;
  patients: number;
}

const hourSpan = (from: number, to: number) => `${formatHour(from)} to ${formatHour(to)}`;

/** Busiest three-hour run within a day, the quietest day, and the share in that run. */
export function intakeFinding(grid: number[][], period: string) {
  const total = grid.flat().reduce((sum, value) => sum + value, 0);
  if (total === 0) return `No new patients in ${period}.`;

  let best = { day: 0, start: 0, patients: -1 };
  for (const day of DAYS) {
    for (let start = 0; start <= 21; start++) {
      const patients = grid[day]![start]! + grid[day]![start + 1]! + grid[day]![start + 2]!;
      if (patients > best.patients) best = { day, start, patients };
    }
  }
  const totals = DAYS.map((day) => grid[day]!.reduce((sum, value) => sum + value, 0));
  const quietest = totals.indexOf(Math.min(...totals));

  return `Busiest window: ${WEEKDAYS[best.day]}s, ${hourSpan(best.start, best.start + 3)}, with ${formatNumber(best.patients)} new patients (${formatPercent(best.patients / total)} of ${period}). ${WEEKDAYS[quietest]}s are the quietest day.`;
}

export function toGrid(cells: Cell[]) {
  const grid = DAYS.map(() => HOURS.map(() => 0));
  for (const cell of cells) grid[cell.weekday]![cell.hour] = cell.patients;
  return grid;
}

/**
 * Weekday by hour. Wide panels run hours across and days down; narrow ones swap the
 * axes so 24 columns never have to fit a phone. The DOM keeps weekdays as rows either way.
 */
export function IntakeHeatmap({ data, timezone }: { data: IntakeHours; timezone: string }) {
  const tip = useChartTip<Cell>();
  const grid = toGrid(data.cells);
  const bounds = classBounds(data.max);
  const level = (patients: number) => bounds.filter((bound) => patients >= bound).length;
  const [active, setActive] = useState({ day: 0, hour: 0 });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const cell = (day: number, hour: number) =>
      container.querySelector<HTMLElement>(`[data-cell="${day}-${hour}"]`);
    // Which way the hours run depends on the container's width, so ask the layout.
    const hoursAcross = cell(0, 0)?.offsetTop === cell(0, 1)?.offsetTop;
    const across = hoursAcross ? "hour" : "day";
    const down = hoursAcross ? "day" : "hour";
    const limit = { day: 6, hour: 23 };
    const next = { ...active };
    const move = (axis: "day" | "hour", step: number) => {
      next[axis] = Math.min(limit[axis], Math.max(0, next[axis] + step));
    };

    if (event.key === "ArrowRight") move(across, 1);
    else if (event.key === "ArrowLeft") move(across, -1);
    else if (event.key === "ArrowDown") move(down, 1);
    else if (event.key === "ArrowUp") move(down, -1);
    else if (event.key === "Home") next[across] = 0;
    else if (event.key === "End") next[across] = limit[across];
    else return;

    event.preventDefault();
    setActive(next);
    cell(next.day, next.hour)?.focus();
  };

  const legend = [0, ...bounds].map((bound, index) => ({ index, label: formatNumber(bound) }));

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/heat">
        <div
          role="grid"
          aria-label={`New patients by weekday and hour, ${timezone} time`}
          onKeyDown={onKeyDown}
          className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] grid-rows-[auto_repeat(24,0.875rem)] gap-0.5 @2xl/heat:grid-cols-[2.25rem_repeat(24,minmax(0,1fr))] @2xl/heat:grid-rows-[auto_repeat(7,1.75rem)]"
        >
          <div role="row" className="contents">
            <span role="columnheader" className="sr-only">
              Weekday
            </span>
            {HOURS.map((hour) => (
              <span
                key={hour}
                role="columnheader"
                style={{ "--h": hour + 2 } as CSSProperties}
                className="pr-1 text-right text-[0.6875rem] leading-[0.875rem] text-muted-foreground [grid-column:1] [grid-row:var(--h)] @2xl/heat:pr-0 @2xl/heat:pb-1 @2xl/heat:text-left @2xl/heat:leading-none @2xl/heat:[grid-column:var(--h)] @2xl/heat:[grid-row:1]"
              >
                <span aria-hidden="true">{hour % 3 === 0 ? formatHour(hour) : ""}</span>
                <span className="sr-only">{hourSpan(hour, hour + 1)}</span>
              </span>
            ))}
          </div>

          {DAYS.map((day) => (
            <div key={day} role="row" className="contents">
              <span
                role="rowheader"
                style={{ "--d": day + 2 } as CSSProperties}
                className="pb-1 text-center text-xs text-muted-foreground [grid-column:var(--d)] [grid-row:1] @2xl/heat:self-center @2xl/heat:pb-0 @2xl/heat:text-left @2xl/heat:[grid-column:1] @2xl/heat:[grid-row:var(--d)]"
              >
                <span aria-hidden="true">{WEEKDAYS[day]!.slice(0, 3)}</span>
                <span className="sr-only">{WEEKDAYS[day]}</span>
              </span>
              {HOURS.map((hour) => {
                const patients = grid[day]![hour]!;
                const isActive = active.day === day && active.hour === hour;
                return (
                  <ChartMark
                    key={hour}
                    handle={tip}
                    payload={{ weekday: day, hour, patients }}
                    render={
                      <div
                        role="gridcell"
                        data-cell={`${day}-${hour}`}
                        tabIndex={isActive ? 0 : -1}
                        onFocus={() => setActive({ day, hour })}
                        style={
                          {
                            "--d": day + 2,
                            "--h": hour + 2,
                            backgroundColor: levelColor(level(patients)),
                          } as CSSProperties
                        }
                        className="cursor-default rounded-[3px] outline-none [grid-column:var(--d)] [grid-row:var(--h)] hover:ring-2 hover:ring-foreground focus-visible:ring-2 focus-visible:ring-foreground @2xl/heat:[grid-column:var(--h)] @2xl/heat:[grid-row:var(--d)]"
                      />
                    }
                  >
                    <span className="sr-only">{formatNumber(patients)} new patients</span>
                  </ChartMark>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <figure className="flex flex-col gap-1.5">
          <figcaption className="text-xs text-muted-foreground">New patients in an hour</figcaption>
          <div className="flex gap-0.5" aria-hidden="true">
            {legend.map((step) => (
              <div key={step.index} className="flex w-9 flex-col gap-1">
                <span
                  className="h-3 rounded-[3px]"
                  style={{ backgroundColor: levelColor(step.index) }}
                />
                <span className="tabular text-[0.6875rem] text-muted-foreground">
                  {step.label}
                  {step.index === LEVELS && "+"}
                </span>
              </div>
            ))}
          </div>
          <p className="sr-only">
            Darker cells had more new patients, from none up to {formatNumber(data.max)} in the
            busiest hour.
          </p>
        </figure>
        <p className="text-xs text-muted-foreground">
          Times in {timezone.replaceAll("_", " ")}. Weeks start on Sunday, as the working week does
          in Bangladesh.
        </p>
      </div>

      <ChartTip handle={tip}>
        {(cell) => (
          <>
            <TipTitle>
              {WEEKDAYS[cell.weekday]}, {hourSpan(cell.hour, cell.hour + 1)}
            </TipTitle>
            <TipRow value={formatNumber(cell.patients)} label="new patients" />
          </>
        )}
      </ChartTip>
    </div>
  );
}
