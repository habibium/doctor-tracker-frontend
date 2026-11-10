import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** The outline of a list page, shown while its first page of data is on the way. */
export function ListFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-full rounded-full sm:w-72" />
        <Skeleton className="h-9 w-44 rounded-full" />
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <DataTableSkeleton />
      </div>
    </div>
  );
}
