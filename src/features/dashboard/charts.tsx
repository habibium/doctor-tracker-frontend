"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Demographics, Registrations } from "@/lib/api";
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

export function RegistrationsChart({ data }: { data: Registrations }) {
  const monthly = data.interval === "month";
  const ticks = roundTicks(Math.max(...data.points.map((point) => point.patients)));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={data.points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={36}
          tickFormatter={(value: string) =>
            (monthly ? monthFormat : dayFormat).format(bucketDate(value))
          }
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
              labelFormatter={(value) =>
                (monthly ? longMonthFormat : longDayFormat).format(bucketDate(String(value)))
              }
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
