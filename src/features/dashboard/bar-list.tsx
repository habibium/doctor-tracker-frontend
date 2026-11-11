import type { ReactNode } from "react";
import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface BarListItem {
  key: string;
  label: string;
  /** Secondary line under the label. */
  detail?: string;
  value: number;
  href?: string;
  /** A comparison after the value, such as the change on the previous period. */
  aside?: ReactNode;
}

/**
 * Ranked horizontal bars on a shared baseline. Every bar is the same neutral ink:
 * length already encodes the value, and colour is kept for patient condition.
 */
interface BarListProps {
  items: BarListItem[];
  /** Read out after each value, e.g. "patients". */
  unit: string;
  /** Narrower label column, for short labels in a narrow panel. */
  compact?: boolean;
  /** Fill class; a condition colour only when every bar counts patients in that condition. */
  fill?: string;
}

export function BarList({ items, unit, compact = false, fill = "bg-data" }: BarListProps) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const withAside = items.some((item) => item.aside !== undefined);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.key}
          className={cn(
            "grid items-center gap-3 text-sm",
            compact
              ? "grid-cols-[4.5rem_minmax(0,1fr)_3.25rem]"
              : withAside
                ? "grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_3.25rem_3.5rem] sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3.25rem_3.5rem] xl:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_3.25rem_3.5rem]"
                : "grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_3.25rem] sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3.25rem] xl:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_3.25rem]",
          )}
        >
          <div className="flex min-w-0 flex-col">
            {item.href ? (
              <Link href={item.href} className="truncate underline-offset-4 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="truncate">{item.label}</span>
            )}
            {item.detail && (
              <span className="truncate text-xs text-muted-foreground">{item.detail}</span>
            )}
          </div>
          <div className="h-2.5" aria-hidden="true">
            {item.value > 0 && (
              <div
                className={cn("h-full min-w-0.5 rounded-r", fill)}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            )}
          </div>
          <span className="tabular text-right">
            {formatNumber(item.value)}
            <span className="sr-only"> {unit}</span>
          </span>
          {withAside && <span className="text-right text-xs text-muted-foreground">{item.aside}</span>}
        </li>
      ))}
    </ul>
  );
}
