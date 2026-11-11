"use client";

import { ConditionBarTall, ConditionLegend } from "@/features/patients/condition-bar";
import type { ConditionBreakdown, ConditionCounts } from "@/lib/api";
import { formatNumber } from "@/lib/format";

/**
 * The dashboard's lead: everyone in care as one bar, split by condition. Segment width
 * is the share; the list underneath gives the same figures as text.
 */
export function ConditionCensus({ breakdown }: { breakdown: ConditionBreakdown }) {
  const counts: ConditionCounts = { stable: 0, recovering: 0, under_observation: 0, critical: 0 };
  for (const item of breakdown) counts[item.condition] = item.patients;
  const total = breakdown.reduce((sum, item) => sum + item.patients, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm text-muted-foreground">Patients in care</h3>
        <p className="text-5xl font-semibold tracking-tight">{formatNumber(total)}</p>
      </div>

      {total > 0 && (
        <>
          <ConditionBarTall counts={counts} label="Patients by condition" />
          <ConditionLegend counts={counts} className="sm:grid-cols-2 lg:grid-cols-4" />
        </>
      )}
    </div>
  );
}
