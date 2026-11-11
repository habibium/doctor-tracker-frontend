"use client";

import { ChartMark, ChartTip, TipRow, TipTitle, useChartTip } from "@/components/charts/chart-tip";
import { useRovingFocus } from "@/components/charts/use-roving-focus";
import type { Workload } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type Bucket = Workload["buckets"][number];

/** The finding in words, so the chart is a check on the sentence rather than a puzzle. */
export function workloadFinding(data: Workload) {
  if (data.doctors === 0) return "No doctors on the roster yet.";
  const parts = [
    `Half of the ${formatNumber(data.doctors)} doctors have ${formatNumber(data.median)} patients or fewer, while the busiest tenth have ${formatNumber(data.p90)} or more each, up to ${formatNumber(data.max)}.`,
  ];
  if (data.average > data.median * 1.15) {
    parts.push(`That tail pulls the average up to ${formatNumber(data.average)}.`);
  }
  return parts.join(" ");
}

const bucketLabel = (bucket: Bucket) =>
  bucket.min === bucket.max
    ? `${formatNumber(bucket.min)} patients`
    : `${formatNumber(bucket.min)} to ${formatNumber(bucket.max)} patients`;

/**
 * Histogram of doctors by patient count. Bins are contiguous, so the columns fill their
 * bins with only the 2px gap between; the median and 90th percentile are drawn as rules.
 */
export function WorkloadChart({ data }: { data: Workload }) {
  const tip = useChartTip<Bucket>();
  const { onKeyDown, markProps } = useRovingFocus(data.buckets.length);

  const low = data.buckets[0]?.min ?? 0;
  const high = (data.buckets.at(-1)?.max ?? 0) + 1;
  // Bounds are whole patients, so a value sits in the middle of its own unit.
  const position = (value: number) => ((value + 0.5 - low) / Math.max(1, high - low)) * 100;
  const peak = Math.max(1, ...data.buckets.map((bucket) => bucket.doctors));

  const markers = [
    { key: "median", label: "Median", value: data.median },
    { key: "p90", label: "90th percentile", value: data.p90 },
  ].map((marker) => ({ ...marker, x: position(marker.value) }));
  // Labels share a row unless they would run into each other.
  const stacked = Math.abs(markers[0]!.x - markers[1]!.x) < 30;

  const edges = [...data.buckets.map((bucket) => bucket.min), high];
  const every = edges.length > 7 ? 2 : 1;

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative">
        <div aria-hidden="true" className={cn("relative", stacked ? "h-10" : "h-5")} />
        {markers.map((marker, index) => {
          const flip = marker.x > 70;
          return (
            <div
              key={marker.key}
              aria-hidden="true"
              style={{ left: `${marker.x}%` }}
              className={cn(
                "pointer-events-none absolute bottom-0 z-[1] flex flex-col",
                stacked && index === 1 ? "top-5" : "top-0",
                flip ? "-translate-x-full items-end" : "items-start",
              )}
            >
              <span className={cn("text-xs whitespace-nowrap", flip ? "pr-1.5" : "pl-1.5")}>
                <span className="text-muted-foreground">{marker.label}</span>{" "}
                <span className="tabular font-medium">{formatNumber(marker.value)}</span>
              </span>
              {/* The surface ring keeps the rule readable where it crosses a column. */}
              <span className="w-px flex-1 bg-foreground shadow-[0_0_0_1px_var(--color-card)]" />
            </div>
          );
        })}

        <div
          role="group"
          aria-label="Doctors by number of patients in their care"
          onKeyDown={onKeyDown}
          className="flex h-56 items-stretch gap-0.5 border-b"
        >
          {data.buckets.map((bucket, index) => (
            <ChartMark
              key={bucket.min}
              handle={tip}
              payload={bucket}
              render={
                <div
                  {...markProps(index)}
                  aria-label={`${bucketLabel(bucket)}: ${formatNumber(bucket.doctors)} doctors`}
                  className="group relative flex min-w-0 flex-1 cursor-default flex-col justify-end rounded-t outline-none focus-visible:bg-muted"
                />
              }
            >
              <div
                style={{ height: `calc((100% - 1.25rem) * ${bucket.doctors / peak})` }}
                className="relative rounded-t bg-data transition-opacity group-hover:opacity-80"
              >
                {/* Sits above the rules, on the card, so a rule never strikes through it. */}
                <span
                  aria-hidden="true"
                  className="tabular absolute bottom-full left-1/2 z-[2] mb-1 -translate-x-1/2 bg-card px-0.5 text-xs text-muted-foreground"
                >
                  {formatNumber(bucket.doctors)}
                </span>
              </div>
            </ChartMark>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="relative h-4 text-xs text-muted-foreground">
        {edges.map(
          (edge, index) =>
            (index % every === 0 || index === edges.length - 1) && (
              <span
                key={edge}
                style={{ left: `${(index / (edges.length - 1)) * 100}%` }}
                className={cn(
                  "tabular absolute top-0",
                  index === 0 ? "" : index === edges.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
                )}
              >
                {formatNumber(edge)}
              </span>
            ),
        )}
      </div>
      <figcaption className="text-xs text-muted-foreground">
        Patients per doctor. Each column counts the doctors in that range.
      </figcaption>

      <ChartTip handle={tip}>
        {(bucket) => (
          <>
            <TipTitle>{bucketLabel(bucket)}</TipTitle>
            <TipRow
              value={formatNumber(bucket.doctors)}
              label={`doctors, ${formatPercent(bucket.doctors / Math.max(1, data.doctors))}`}
            />
          </>
        )}
      </ChartTip>
    </figure>
  );
}
