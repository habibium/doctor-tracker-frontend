"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { formatShare } from "@/components/charts/chart-format";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiagnosisCount } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import { BarList } from "./bar-list";
import { Panel, QueryContent } from "./panel";
import { analyticsQueries } from "./queries";

const SHOWN = 8;
/** Diagnoses with fewer patients in the earlier window swing on a handful, so they can't lead "rising". */
const MIN_FOR_RISING = 20;

export const patientsWithDiagnosis = (diagnosis: string) => `/patients?${new URLSearchParams({ diagnosis })}`;

const sum = (rows: DiagnosisCount[], pick: (row: DiagnosisCount) => number) =>
  rows.reduce((total, row) => total + pick(row), 0);

const changeRatio = (row: DiagnosisCount) =>
  row.previous30Days > 0 ? (row.last30Days - row.previous30Days) / row.previous30Days : 0;

function changePhrase(row: DiagnosisCount) {
  if (row.previous30Days === 0) return "none in the 30 days before";
  const change = changeRatio(row);
  if (Math.abs(change) < 0.005) return "the same as the 30 days before";
  return `${formatPercent(Math.abs(change))} ${change > 0 ? "more" : "fewer"} than the 30 days before`;
}

/**
 * Change on the 30 days before. Neutral ink on purpose: more of an illness is not good news,
 * and green and red are kept for patient condition.
 */
export function Change({ row }: { row: DiagnosisCount }) {
  if (row.previous30Days === 0) return row.last30Days > 0 ? <>new</> : <>–</>;
  const change = changeRatio(row);
  const Icon = change >= 0 ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span className="inline-flex items-center gap-0.5 tabular">
      <Icon className="size-3" aria-hidden="true" />
      {formatPercent(Math.abs(change))}
      <span className="sr-only">{change >= 0 ? " more" : " fewer"} than the 30 days before</span>
    </span>
  );
}

function commonFinding(rows: DiagnosisCount[]) {
  const total = sum(rows, (row) => row.patients);
  const lead = rows[0];
  if (!lead || total === 0) return "No patients in care yet.";
  const top = rows.slice(0, SHOWN);
  return `${lead.diagnosis} is the most common, with ${formatNumber(lead.patients)} patients. These ${top.length} make up ${formatShare(sum(top, (row) => row.patients) / total)} of everyone in care, across ${formatNumber(rows.length)} diagnoses.`;
}

function recentFinding(rows: DiagnosisCount[]) {
  const byRecent = rows.toSorted((a, b) => b.last30Days - a.last30Days || b.patients - a.patients);
  const lead = byRecent[0];
  if (!lead || lead.last30Days === 0) return "No new patients in the last 30 days.";
  const rising = rows
    .filter((row) => row.previous30Days >= MIN_FOR_RISING)
    .toSorted((a, b) => changeRatio(b) - changeRatio(a))[0];
  const parts = [
    `${lead.diagnosis} brought in the most new patients in the last 30 days, ${formatNumber(lead.last30Days)}, ${changePhrase(lead)}.`,
  ];
  if (rising && rising !== lead && changeRatio(rising) > 0) {
    parts.push(`${rising.diagnosis} is rising fastest, up ${formatPercent(changeRatio(rising))}.`);
  }
  return parts.join(" ");
}

const listFallback = <Skeleton className="h-[23.25rem] w-full rounded-xl" />;

/** The clinic's caseload two ways: what most patients in care have, and what is arriving now. */
export function DiagnosisPanels() {
  const query = useQuery(analyticsQueries.diagnoses());
  const rows = query.data ?? [];

  return (
    <>
      <Panel
        title="Most common diagnoses"
        description={query.data ? commonFinding(rows) : "What the patients in our care are being treated for."}
      >
        <QueryContent query={query} fallback={listFallback}>
          {(data) => (
            <BarList
              unit="patients"
              items={data.slice(0, SHOWN).map((row) => ({
                key: row.diagnosis,
                label: row.diagnosis,
                detail: `${formatNumber(row.last30Days)} new in the last 30 days`,
                value: row.patients,
                href: patientsWithDiagnosis(row.diagnosis),
              }))}
            />
          )}
        </QueryContent>
      </Panel>

      <Panel
        title="Arriving now"
        description={query.data ? recentFinding(rows) : "New patients in the last 30 days, by diagnosis."}
      >
        <QueryContent query={query} fallback={listFallback}>
          {(data) => (
            <BarList
              unit="new patients in the last 30 days"
              items={data
                .toSorted((a, b) => b.last30Days - a.last30Days || b.patients - a.patients)
                .slice(0, SHOWN)
                .map((row) => ({
                  key: row.diagnosis,
                  label: row.diagnosis,
                  detail: `${formatNumber(row.previous30Days)} in the 30 days before`,
                  value: row.last30Days,
                  href: patientsWithDiagnosis(row.diagnosis),
                  aside: <Change row={row} />,
                }))}
            />
          )}
        </QueryContent>
      </Panel>
    </>
  );
}
