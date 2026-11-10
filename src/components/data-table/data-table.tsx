"use client";

import type { ReactNode } from "react";
import {
  type ColumnDef,
  createColumnHelper,
  type RowData,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/stores/preferences";

// Sorting, filtering and paging all happen in the API, so the table needs no extra features.
const features = tableFeatures({});
type Features = typeof features;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cell value types vary per column
export type DataTableColumn<TData extends RowData> = ColumnDef<Features, TData, any>;

export const createColumns = <TData extends RowData>() => createColumnHelper<Features, TData>();

interface DataTableProps<TData extends RowData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  /** Replaces the table on small screens, where columns would not fit. */
  renderCard: (row: TData) => ReactNode;
  /** True while a newer page is loading and the previous one is still shown. */
  isStale?: boolean;
  /** Per-column classes, keyed by column id, applied to both header and cells. */
  columnClassNames?: Record<string, string>;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  renderCard,
  isStale = false,
  columnClassNames = {},
}: DataTableProps<TData>) {
  const density = usePreferences((state) => state.density);
  const table = useTable({ features, columns, data });
  const rows = table.getRowModel().rows;

  return (
    <div
      aria-busy={isStale}
      className={cn("transition-opacity", isStale && "opacity-60")}
    >
      <ul className="flex flex-col divide-y md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="p-4">
            {renderCard(row.original)}
          </li>
        ))}
      </ul>

      <Table className="hidden table-fixed md:table">
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "h-10 px-4 text-xs font-medium text-muted-foreground",
                    columnClassNames[header.column.id],
                  )}
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    "px-4",
                    density === "compact" ? "py-1.5" : "py-3",
                    columnClassNames[cell.column.id],
                  )}
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
