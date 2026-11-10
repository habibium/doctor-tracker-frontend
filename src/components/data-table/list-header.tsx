import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";

interface ListHeaderProps {
  total: number;
  singular: string;
  plural: string;
  /** View controls such as sort order and row spacing. */
  children?: ReactNode;
}

/** Sits above the table: how many rows match, and how they are shown. */
export function ListHeader({ total, singular, plural, children }: ListHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2">
      <p className="text-sm text-muted-foreground">
        <span className="tabular font-medium text-foreground">{formatNumber(total)}</span>{" "}
        {total === 1 ? singular : plural}
      </p>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
