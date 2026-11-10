"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CONDITION_BY_VALUE } from "@/features/patients/conditions";
import type { ConditionBreakdown } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The dashboard's lead: everyone in care as one bar, split by condition. Segment width
 * is the share; the list underneath gives the same figures as text.
 */
export function ConditionCensus({ breakdown }: { breakdown: ConditionBreakdown }) {
  const total = breakdown.reduce((sum, item) => sum + item.patients, 0);
  const segments = breakdown
    .filter((item) => item.patients > 0)
    .map((item) => ({ ...CONDITION_BY_VALUE[item.condition], patients: item.patients }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm text-muted-foreground">Patients in care</h2>
        <p className="text-5xl font-semibold tracking-tight">{formatNumber(total)}</p>
      </div>

      {total > 0 && (
        <>
          <div role="group" aria-label="Patients by condition" className="flex h-7 gap-0.5">
            {segments.map((segment) => (
              <Tooltip key={segment.value}>
                <TooltipTrigger
                  render={
                    <div
                      tabIndex={0}
                      aria-label={`${segment.label}: ${formatNumber(segment.patients)} patients, ${formatPercent(segment.patients / total)}`}
                      // Grows in proportion to its count; the 2px gap separates neighbours.
                      style={{ flexGrow: segment.patients }}
                      className={cn(
                        "@container flex min-w-1 basis-0 items-center rounded px-2 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        segment.fill,
                        segment.onFill,
                      )}
                    />
                  }
                >
                  {/* Printed only where the segment is wide enough to hold it. */}
                  <span className="hidden @[2.5rem]:inline">
                    {formatPercent(segment.patients / total)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {segment.label}: {formatNumber(segment.patients)} patients
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <ul className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {segments.map((segment) => (
              <li key={segment.value} className="flex items-center gap-2">
                <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", segment.fill)} />
                <span className="truncate text-muted-foreground">{segment.label}</span>
                <span className="tabular ml-auto font-medium lg:ml-0">
                  {formatNumber(segment.patients)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
