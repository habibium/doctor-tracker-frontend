import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { ListLayout, ListToolbar } from "@/components/data-table/list-layout";
import { Skeleton } from "@/components/ui/skeleton";

/** The outline of a list page, shown while its first page of data is on the way. */
export function ListFallback() {
  return (
    <ListLayout fill>
      <ListToolbar>
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="hidden h-9 w-[4.5rem] rounded-full md:block" />
      </ListToolbar>
      <DataTableSkeleton />
    </ListLayout>
  );
}
