"use client";

import { ChartMark, ChartTip, TipRow, TipTitle, useChartTip } from "@/components/charts/chart-tip";
import type { ConditionCounts } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CONDITIONS } from "./conditions";

export type ConditionPart = ReturnType<typeof conditionParts>["parts"][number];

export function conditionParts(counts: ConditionCounts) {
  const total = CONDITIONS.reduce((sum, condition) => sum + counts[condition.value], 0);
  return {
    total,
    parts: CONDITIONS.map((condition) => ({
      ...condition,
      patients: counts[condition.value],
      share: total > 0 ? counts[condition.value] / total : 0,
    })),
  };
}

/** "Stable 218 (45%), Recovering 146 (30%), …" for an accessible name. */
export function describeConditions(counts: ConditionCounts) {
  const { parts } = conditionParts(counts);
  return parts
    .map((part) => `${part.label} ${formatNumber(part.patients)} (${formatPercent(part.share)})`)
    .join(", ");
}

function ConditionTipRows({ counts, title }: { counts: ConditionCounts; title: string }) {
  const { parts } = conditionParts(counts);
  return (
    <>
      <TipTitle>{title}</TipTitle>
      {parts.map((part) => (
        <TipRow
          key={part.value}
          swatch={part.fill}
          value={formatNumber(part.patients)}
          label={`${part.label}, ${formatPercent(part.share)}`}
        />
      ))}
    </>
  );
}

interface ConditionBarProps {
  counts: ConditionCounts;
  /** Names the whole, e.g. "Pediatrics": heads the tooltip and the accessible name. */
  label: string;
  className?: string;
}

/**
 * One whole split by condition, read beside its own figures: 8px, no text, one tooltip
 * listing every part. Parts keep severity order, so critical always ends the bar.
 */
export function ConditionBar({ counts, label, className }: ConditionBarProps) {
  const tip = useChartTip<null>();
  const { total, parts } = conditionParts(counts);

  if (total === 0) {
    return (
      <div
        role="img"
        aria-label={`${label}: no patients`}
        className={cn("h-2 rounded-full bg-muted", className)}
      />
    );
  }

  return (
    <>
      <ChartMark
        handle={tip}
        payload={null}
        render={
          <div
            tabIndex={0}
            role="img"
            aria-label={`${label}: ${describeConditions(counts)}`}
            className={cn(
              // The padding widens the hover target without moving the bar.
              "-my-1.5 flex cursor-default gap-0.5 rounded-full py-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              className,
            )}
          />
        }
      >
        {parts.map(
          (part) =>
            part.patients > 0 && (
              <span
                key={part.value}
                style={{ flexGrow: part.patients }}
                className={cn("h-2 min-w-0.5 basis-0 rounded-full", part.fill)}
              />
            ),
        )}
      </ChartMark>
      <ChartTip handle={tip}>{() => <ConditionTipRows counts={counts} title={label} />}</ChartTip>
    </>
  );
}

/**
 * One whole split by condition, standing alone: 28px blocks with the share printed
 * inside wherever it fits. Each block is its own hover and focus target.
 */
export function ConditionBarTall({ counts, label }: { counts: ConditionCounts; label: string }) {
  const tip = useChartTip<ConditionPart>();
  const { parts } = conditionParts(counts);

  return (
    <div role="group" aria-label={label} className="flex h-7 gap-0.5">
      {parts.map(
        (part) =>
          part.patients > 0 && (
            <ChartMark
              key={part.value}
              handle={tip}
              payload={part}
              render={
                <div
                  tabIndex={0}
                  aria-label={`${part.label}: ${formatNumber(part.patients)} patients, ${formatPercent(part.share)}`}
                  style={{ flexGrow: part.patients }}
                  className={cn(
                    "@container flex min-w-1 basis-0 cursor-default items-center rounded px-2 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    part.fill,
                    part.onFill,
                  )}
                />
              }
            >
              <span aria-hidden="true" className="hidden @[2.5rem]:inline">
                {formatPercent(part.share)}
              </span>
            </ChartMark>
          ),
      )}
      <ChartTip handle={tip}>
        {(part) => (
          <TipRow
            swatch={part.fill}
            value={formatNumber(part.patients)}
            label={`${part.label}, ${formatPercent(part.share)}`}
          />
        )}
      </ChartTip>
    </div>
  );
}

/** Names in bar order, each with its count; doubles as the legend. */
export function ConditionLegend({
  counts,
  className,
}: {
  counts: ConditionCounts;
  className?: string;
}) {
  const { parts } = conditionParts(counts);
  return (
    <ul className={cn("grid gap-x-6 gap-y-2 text-sm", className)}>
      {parts.map((part) => (
        <li key={part.value} className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", part.fill)} />
          <span className="truncate text-muted-foreground">{part.label}</span>
          <span className="tabular ml-auto font-medium">{formatNumber(part.patients)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Counts in a line, each keyed by its colour: the figures beside a thin bar on a card. */
export function ConditionCountsLine({ counts }: { counts: ConditionCounts }) {
  const { total, parts } = conditionParts(counts);
  if (total === 0) return <p className="text-xs text-muted-foreground">No patients yet</p>;
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {parts.map((part) => (
        <li key={part.value} className="flex items-center gap-1">
          <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", part.fill)} />
          <span className="tabular font-medium">{formatNumber(part.patients)}</span>
          <span className="text-muted-foreground">{part.label.toLowerCase()}</span>
        </li>
      ))}
    </ul>
  );
}

/** Colour key for a column or list of thin bars, in bar order. */
export function ConditionKey({ className }: { className?: string }) {
  return (
    <ul aria-hidden="true" className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", className)}>
      {CONDITIONS.map((condition) => (
        <li key={condition.value} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", condition.fill)} />
          {condition.label}
        </li>
      ))}
    </ul>
  );
}
