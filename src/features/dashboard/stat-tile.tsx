import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** A plain-language line under the value. */
  detail?: ReactNode;
  className?: string;
}

export function StatTile({ label, value, detail, className }: StatTileProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 bg-card p-5 md:p-6", className)}>
      <h3 className="text-sm text-muted-foreground">{label}</h3>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

/** Change against the previous period. The arrow and sign say the direction without colour. */
export function Delta({ current, previous, period }: { current: number; previous: number; period: string }) {
  if (previous === 0) return <>No earlier period to compare.</>;

  const change = (current - previous) / previous;
  const Icon = change >= 0 ? ArrowUpIcon : ArrowDownIcon;

  return (
    <>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium",
          change >= 0 ? "text-positive" : "text-destructive",
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {formatPercent(Math.abs(change))}
        <span className="sr-only">{change >= 0 ? "more" : "fewer"}</span>
      </span>{" "}
      compared with {period}
    </>
  );
}
