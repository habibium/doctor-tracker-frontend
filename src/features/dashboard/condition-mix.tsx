"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { formatShare } from "@/components/charts/chart-format";
import { TableView, TD, TH } from "@/components/charts/table-view";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SpecializationIcon } from "@/features/doctors/specialization";
import { ConditionBar } from "@/features/patients/condition-bar";
import { CONDITIONS } from "@/features/patients/conditions";
import type { ConditionMix } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Panel, QueryContent } from "./panel";
import {
  analyticsQueries,
  MIX_GROUPS,
  type MixGroup,
  mixOrderParam,
  type MixOrder,
  mixParam,
} from "./queries";

type Row = ConditionMix[number] & { share: number };

/** Groups this small swing on a handful of patients, so they sit out of the headline. */
const MIN_PATIENTS_FOR_FINDING = 50;

function withShares(rows: ConditionMix) {
  const patients = rows.reduce((sum, row) => sum + row.patients, 0);
  const critical = rows.reduce((sum, row) => sum + row.critical, 0);
  return {
    overall: patients > 0 ? critical / patients : 0,
    rows: rows.map((row) => ({ ...row, share: row.patients > 0 ? row.critical / row.patients : 0 })),
  };
}

function finding(rows: Row[], overall: number, plural: string) {
  const candidates = rows.filter((row) => row.patients >= MIN_PATIENTS_FOR_FINDING);
  if (candidates.length < 2) return "How each group's patients split by condition.";
  const ranked = candidates.toSorted((a, b) => b.share - a.share);
  const highest = ranked[0]!;
  const lowest = ranked.at(-1)!;
  return `${highest.key} has the highest share of critical patients, ${formatShare(highest.share)} against ${formatShare(overall)} across all ${plural}. ${lowest.key} has the lowest, ${formatShare(lowest.share)}.`;
}

function MixControls({
  group,
  order,
  onGroupChange,
  onOrderChange,
}: {
  group: MixGroup;
  order: MixOrder;
  onGroupChange: (group: MixGroup) => void;
  onOrderChange: (order: MixOrder) => void;
}) {
  const queryClient = useQueryClient();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        variant="outline"
        size="sm"
        spacing={0}
        aria-label="Group by"
        value={[group]}
        onValueChange={(next) => {
          const value = next[0] as MixGroup | undefined;
          if (value) onGroupChange(value);
        }}
      >
        {MIX_GROUPS.map((item) => (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            // Warm the other grouping so the switch is instant.
            onPointerEnter={() => void queryClient.prefetchQuery(analyticsQueries.conditionMix(item.value))}
          >
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ToggleGroup
        variant="outline"
        size="sm"
        spacing={0}
        aria-label="Order rows by"
        value={[order]}
        onValueChange={(next) => {
          const value = next[0] as MixOrder | undefined;
          if (value) onOrderChange(value);
        }}
      >
        <ToggleGroupItem value="patients">Most patients</ToggleGroupItem>
        <ToggleGroupItem value="critical">Critical share</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

const ROW = "grid grid-cols-[minmax(0,1fr)_auto_3.5rem] items-center gap-x-4 sm:grid-cols-[minmax(0,12rem)_4rem_minmax(0,1fr)_3.5rem]";

function MixList({
  rows,
  overall,
  group,
}: {
  rows: Row[];
  overall: number;
  group: (typeof MIX_GROUPS)[number];
}) {
  return (
    <div className="flex flex-col gap-3">
      <ul aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {CONDITIONS.map((condition) => (
          <li key={condition.value} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", condition.fill)} />
            {condition.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-foreground" />
          Critical share across all
        </li>
      </ul>

      <div className={cn(ROW, "border-b pb-2 text-xs text-muted-foreground")} aria-hidden="true">
        <span>{group.label}</span>
        <span className="text-right">Patients</span>
        <span className="hidden sm:block">Split by condition</span>
        <span className="text-right">Critical</span>
      </div>

      <ul className="flex flex-col gap-y-3">
        {rows.map((row) => (
          <li key={row.key} className={cn(ROW, "gap-y-2 text-sm")}>
            <div className="flex min-w-0 items-start gap-2">
              {group.value === "specialization" && (
                <SpecializationIcon name={row.key} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex min-w-0 flex-col">
                <Link
                  href={`/doctors?${new URLSearchParams({ [group.value]: row.key, sort: "-patientCount" })}`}
                  className="truncate font-medium underline-offset-4 hover:underline"
                  title={`${row.key}: see its doctors`}
                >
                  {row.key}
                </Link>
                <span className="truncate text-xs text-muted-foreground">
                  {formatNumber(row.doctors)} {row.doctors === 1 ? "doctor" : "doctors"}
                  {row.doctors > 0 && `, ${formatNumber(Math.round(row.patients / row.doctors))} patients each`}
                </span>
              </div>
            </div>
            <span className="tabular text-right">
              {formatNumber(row.patients)}
              <span className="sr-only"> patients</span>
            </span>
            <div className="relative col-span-full row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
              <ConditionBar counts={row} label={row.key} />
              {row.patients > 0 && (
                <span
                  aria-hidden="true"
                  style={{ left: `${(1 - overall) * 100}%` }}
                  className="pointer-events-none absolute -inset-y-1 w-px bg-foreground shadow-[0_0_0_1px_var(--color-card)]"
                />
              )}
            </div>
            <span
              className={cn(
                "tabular text-right sm:col-start-4",
                row.share > overall ? "font-semibold" : "text-muted-foreground",
              )}
            >
              {row.patients > 0 ? formatShare(row.share) : "–"}
              <span className="sr-only"> critical</span>
            </span>
          </li>
        ))}
      </ul>

      <TableView>
        <table className="w-full">
          <caption className="sr-only">Patients by condition for each {group.label.toLowerCase()}</caption>
          <thead>
            <tr>
              <th scope="col" className={TH}>
                {group.label}
              </th>
              <th scope="col" className={cn(TH, "text-right")}>
                Patients
              </th>
              {CONDITIONS.map((condition) => (
                <th key={condition.value} scope="col" className={cn(TH, "text-right")}>
                  {condition.label}
                </th>
              ))}
              <th scope="col" className={cn(TH, "text-right")}>
                Critical share
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className={cn(TD, "text-left font-normal")}>
                  {row.key}
                </th>
                <td className={TD}>{formatNumber(row.patients)}</td>
                {CONDITIONS.map((condition) => (
                  <td key={condition.value} className={TD}>
                    {formatNumber(row[condition.value])}
                  </td>
                ))}
                <td className={TD}>{row.patients > 0 ? formatShare(row.share) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableView>
    </div>
  );
}

export function ConditionMixPanel({ className }: { className?: string }) {
  const [{ mix, mixOrder }, setParams] = useQueryStates({ mix: mixParam, mixOrder: mixOrderParam });
  const query = useQuery(analyticsQueries.conditionMix(mix));
  // While the other grouping loads, the rows on screen still belong to the previous one.
  const shown = query.isPlaceholderData ? MIX_GROUPS.find((item) => item.value !== mix) : undefined;
  const group = shown ?? MIX_GROUPS.find((item) => item.value === mix) ?? MIX_GROUPS[0]!;
  const data = query.data && withShares(query.data);
  const rows =
    data &&
    (mixOrder === "critical"
      ? data.rows.toSorted((a, b) => b.share - a.share || b.patients - a.patients)
      : data.rows);

  return (
    <Panel
      title={`Condition mix by ${group.label.toLowerCase()}`}
      description={
        data ? finding(data.rows, data.overall, group.plural) : "Where the critical patients concentrate."
      }
      action={
        <MixControls
          group={mix}
          order={mixOrder}
          onGroupChange={(next) => void setParams({ mix: next })}
          onOrderChange={(next) => void setParams({ mixOrder: next })}
        />
      }
      className={className}
    >
      <QueryContent query={query} fallback={<Skeleton className="h-[48rem] w-full rounded-xl" />}>
        {() => <MixList rows={rows ?? []} overall={data?.overall ?? 0} group={group} />}
      </QueryContent>
    </Panel>
  );
}
