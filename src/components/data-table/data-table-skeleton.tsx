import { Skeleton } from "@/components/ui/skeleton";

const WIDTHS = ["w-44", "w-28", "w-36", "w-24", "w-16", "w-20"];

/** Mirrors the table's row rhythm so content does not jump when data arrives. */
export function DataTableSkeleton({ rows = 10, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div role="status" aria-label="Loading" className="md:min-h-0 md:flex-1 md:overflow-hidden">
      <div className="hidden h-10 items-center gap-6 border-b px-4 md:flex">
        {WIDTHS.slice(0, columns).map((width, index) => (
          <Skeleton key={index} className={`h-3 ${width} max-w-full flex-1`} />
        ))}
      </div>
      <ul className="divide-y">
        {Array.from({ length: rows }, (_, row) => (
          <li key={row} className="flex items-center gap-6 px-4 py-3.5">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-40 max-w-full" />
                <Skeleton className="h-3 w-56 max-w-full md:hidden" />
              </div>
            </div>
            {WIDTHS.slice(1, columns).map((width, index) => (
              <Skeleton key={index} className={`hidden h-3.5 ${width} flex-1 md:block`} />
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
