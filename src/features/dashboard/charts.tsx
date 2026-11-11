"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ReferenceArea, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Demographics, Holiday, Registrations } from "@/lib/api";
import { formatCompact, formatNumber } from "@/lib/format";

// One neutral ink for every series: colour is kept for patient condition.
const chartConfig = {
  patients: { label: "Patients", color: "var(--data)" },
} satisfies ChartConfig;

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const longDayFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" });
const longMonthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** Axis ticks on round numbers (0, 50, 100…) rather than whatever divides the maximum. */
function roundTicks(max: number, intervals = 4) {
  const rough = Math.max(max, 1) / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 5, 10].find((factor) => factor * magnitude >= rough) ?? 10) * magnitude;
  const ticks = [0];
  while (ticks.at(-1)! < max) ticks.push(ticks.at(-1)! + step);
  return ticks;
}

/** Bucket labels are calendar dates, so they are read as UTC to avoid shifting a day. */
const bucketDate = (bucket: string) => new Date(bucket.length === 7 ? `${bucket}-01` : bucket);

/** Labels inside the shading only fit when a day is wide enough. */
const LABELLED_DAYS = 31;

type Point = Registrations["points"][number];

/** Each day's holiday, if any, for the days on the chart. */
export function holidayDays(points: Point[], holidays: Holiday[]) {
  const names = new Map<string, string>();
  for (const point of points) {
    const holiday = holidays.find((item) => item.start <= point.date && point.date <= item.end);
    if (holiday) names.set(point.date, holiday.name);
  }
  return names;
}

const isWorkingDay = (date: string) => ![5, 6].includes(new Date(date).getUTCDay());

/**
 * Says what the shading shows: average intake on holiday working days against other working
 * days (Sunday to Thursday), leaving out today, which is still running.
 */
export function registrationsFinding(data: Registrations) {
  if (data.interval === "month") return "Registered each month. This month is still in progress.";
  const base = "Registered each day. Today is still in progress.";
  const names = holidayDays(data.points, data.holidays);
  const days = data.points.slice(0, -1).filter((point) => isWorkingDay(point.date));
  const on = days.filter((point) => names.has(point.date));
  const off = days.filter((point) => !names.has(point.date));
  if (on.length === 0 || off.length === 0) return base;
  const average = (points: Point[]) => Math.round(points.reduce((sum, point) => sum + point.patients, 0) / points.length);
  return `${base} Shaded days are public holidays in Bangladesh: ${formatNumber(average(on))} new patients a day on those, against ${formatNumber(average(off))} on other working days.`;
}

/** Contiguous runs of the same holiday on the chart, as index ranges. */
function holidaySpans(points: Point[], names: Map<string, string>) {
  const spans: { name: string; from: number; to: number }[] = [];
  points.forEach((point, index) => {
    const name = names.get(point.date);
    const last = spans.at(-1);
    if (!name) return;
    if (last && last.name === name && last.to === index - 1) last.to = index;
    else spans.push({ name, from: index, to: index });
  });
  return spans;
}

/**
 * Daily or monthly new patients. Days run on a numeric axis so a single holiday can be
 * shaded a whole day wide; on a category axis it would collapse to a line.
 */
export function RegistrationsChart({ data }: { data: Registrations }) {
  const monthly = data.interval === "month";
  const ticks = roundTicks(Math.max(...data.points.map((point) => point.patients)));
  const points = data.points.map((point, index) => ({ ...point, index }));
  const last = points.length - 1;
  const names = monthly ? new Map<string, string>() : holidayDays(data.points, data.holidays);
  const spans = holidaySpans(data.points, names);
  const step = Math.max(1, Math.ceil(points.length / 7));
  const xTicks = points.filter((point) => (last - point.index) % step === 0).map((point) => point.index);
  const dateAt = (index: number) => points[Math.round(index)]?.date ?? "";

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        {spans.map((span) => (
          <ReferenceArea
            key={`${span.name}-${span.from}`}
            x1={Math.max(0, span.from - 0.5)}
            x2={Math.min(last, span.to + 0.5)}
            fill="var(--muted-foreground)"
            fillOpacity={0.14}
            stroke="none"
            ifOverflow="hidden"
            label={
              points.length <= LABELLED_DAYS
                ? { value: span.name, position: "insideTopLeft", fontSize: 11, fill: "var(--muted-foreground)" }
                : undefined
            }
          />
        ))}
        <XAxis
          dataKey="index"
          type="number"
          domain={[0, last]}
          ticks={xTicks}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value: number) => (monthly ? monthFormat : dayFormat).format(bucketDate(dateAt(value)))}
        />
        <YAxis
          width={40}
          tickLine={false}
          axisLine={false}
          ticks={ticks}
          domain={[0, ticks.at(-1) ?? 1]}
          tickFormatter={(value: number) => formatCompact(value)}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_, payload) => {
                const date = String(payload?.[0]?.payload?.date ?? "");
                if (!date) return "";
                const label = (monthly ? longMonthFormat : longDayFormat).format(bucketDate(date));
                const holiday = names.get(date);
                return holiday ? `${label}, ${holiday}` : label;
              }}
            />
          }
        />
        <Area
          dataKey="patients"
          type="monotone"
          stroke="var(--color-patients)"
          strokeWidth={2}
          fill="var(--color-patients)"
          fillOpacity={0.1}
          dot={false}
          activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function AgeChart({ data }: { data: Demographics["ageGroups"] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="group" tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
        <Bar
          dataKey="patients"
          fill="var(--color-patients)"
          // Rounded at the data end, square on the baseline.
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="patients"
            position="top"
            offset={8}
            className="fill-foreground"
            formatter={(value) => formatNumber(Number(value))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
