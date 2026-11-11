"use client";

import {
  createContext,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent,
  type ReactNode,
  type TouchEvent,
  use,
  useRef,
  useState,
} from "react";
import {
  type Column,
  type ColumnDef,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  functionalUpdate,
  metaHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseSort, SORT_KINDS, type SortableColumns, type SortValue, toSort } from "@/lib/list-params";
import { cn } from "@/lib/utils";
import { type PinnedColumns, type TableId, usePreferences } from "@/stores/preferences";
import { ColumnHeader, type HeaderPin, type HeaderSort } from "./column-header";
import { type RowActionGroups, RowActionItems, RowActionsMenu } from "./row-actions";

interface DataTableColumnMeta {
  /** "end" right-aligns the header and cells, for numbers. */
  align?: "end";
  /** Applied to the header and every cell, after the defaults. */
  className?: string;
}

// Sorting, filtering and paging happen in the API; these features only lay columns out.
const features = tableFeatures({
  columnVisibilityFeature,
  columnSizingFeature,
  columnPinningFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
});
type Features = typeof features;

type RowRecord = { id: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cell value types vary per column
export type DataTableColumn<TData extends RowRecord> = ColumnDef<Features, TData, any>;

export const createColumns = <TData extends RowRecord>() => createColumnHelper<Features, TData>();

const ACTIONS = "actions";
/** Width of the coloured row edge, in px. */
const ACCENT_WIDTH = 4;
const SHOW_ALL = {};
const HIDE_ACTIONS = { [ACTIONS]: false };
const NO_ACTIONS: RowActionGroups = [];
const getRowId = (row: RowRecord) => row.id;

interface RowActionsContextValue {
  getActions: (row: RowRecord) => RowActionGroups;
  getLabel: (row: RowRecord) => string;
}
/** Lets the module-scope actions column reach the list's per-row actions. */
const RowActionsContext = createContext<RowActionsContextValue | null>(null);

function RowActionsCell({ row }: { row: RowRecord }) {
  const context = use(RowActionsContext);
  if (!context) return null;
  return <RowActionsMenu groups={context.getActions(row)} label={context.getLabel(row)} />;
}

/** The three-dot column. It always stays pinned to the end, so the actions are never off screen. */
export function actionsColumn<TData extends RowRecord>(): DataTableColumn<TData> {
  return {
    id: ACTIONS,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <RowActionsCell row={row.original} />,
    size: 56,
    enablePinning: false,
    meta: { className: "px-3 text-right" },
  };
}

const actionsLast = ({ start, end }: PinnedColumns): PinnedColumns => ({
  start: start.filter((id) => id !== ACTIONS),
  end: [...end.filter((id) => id !== ACTIONS), ACTIONS],
});

/**
 * Sets `data-overflow-start` / `data-overflow-end` while content is scrolled under
 * either pinned edge. Written to the DOM directly so scrolling never re-renders.
 */
function trackOverflow(node: HTMLDivElement) {
  const update = () => {
    // Math.abs: scrollLeft runs negative in right-to-left layouts.
    const scrolled = Math.abs(node.scrollLeft);
    node.toggleAttribute("data-overflow-start", scrolled > 0.5);
    node.toggleAttribute("data-overflow-end", scrolled + node.clientWidth < node.scrollWidth - 0.5);
  };
  update();
  node.addEventListener("scroll", update, { passive: true });
  const observer = new ResizeObserver(update);
  observer.observe(node);
  for (const child of node.children) observer.observe(child);
  return () => {
    node.removeEventListener("scroll", update);
    observer.disconnect();
  };
}

/** Links, form fields and selected text keep the browser's own menu: open in new tab, copy. */
function prefersNativeMenu(target: Element) {
  if (target.closest("a[href], input, textarea, [contenteditable='true']")) return true;
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.containsNode(target, true));
}

const rowIdOf = (target: EventTarget) =>
  target instanceof Element ? target.closest<HTMLElement>("[data-row-id]")?.dataset.rowId : undefined;

// Opaque so scrolled content never shows through pinned cells; tracks the row's hover and open states.
const ROW_BG =
  "[--row-bg:var(--color-card)] hover:[--row-bg:var(--row-hover)] has-aria-expanded:[--row-bg:var(--row-hover)] data-menu-open:[--row-bg:var(--row-hover)] data-menu-open:bg-muted/50";
const PINNED = "sticky z-[1] bg-(--row-bg) transition-shadow";
const START_EDGE =
  "group-data-overflow-start/scroll:shadow-[inset_-1px_0_0_var(--color-border),10px_0_12px_-10px_rgb(0_0_0/0.35)]";
const END_EDGE =
  "group-data-overflow-end/scroll:shadow-[inset_1px_0_0_var(--color-border),-10px_0_12px_-10px_rgb(0_0_0/0.35)]";

interface DataTableProps<TData extends RowRecord, TField extends string> {
  /** Names the table in saved preferences such as pinned columns. */
  id: TableId;
  /** Module-scope array: a new one each render rebuilds the table model. */
  columns: DataTableColumn<TData>[];
  data: TData[];
  /** Pinned until someone changes it. Module-scope, like `columns`. */
  defaultPinning: PinnedColumns;
  /** Takes the spare width when the card is wider than the columns, if it is not pinned. */
  growColumn: string;
  sortable: SortableColumns<TField>;
  sort: SortValue<TField>;
  onSortChange: (sort: SortValue<TField>) => void;
  /** Replaces the table on small screens; `actions` is the row's three-dot menu. */
  renderCard: (row: TData, actions: ReactNode) => ReactNode;
  /** The row's menu, used by both the three-dot button and right click. Omit when no row has any. */
  getRowActions?: (row: TData) => RowActionGroups;
  /** Accessible name for a row's three-dot button, e.g. "Actions for Dr Rahman". */
  getActionsLabel: (row: TData) => string;
  /** Background class for a coloured edge down the row's leading side. */
  rowAccent?: (row: TData) => string;
  /** True while a newer page is loading and the previous one is still shown. */
  isStale?: boolean;
}

export function DataTable<TData extends RowRecord, TField extends string>({
  id,
  columns,
  data,
  defaultPinning,
  growColumn,
  sortable,
  sort,
  onSortChange,
  renderCard,
  getRowActions,
  getActionsLabel,
  rowAccent,
  isStale = false,
}: DataTableProps<TData, TField>) {
  const density = usePreferences((state) => state.density);
  const columnPinning = usePreferences((state) => state.pinnedColumns[id]) ?? defaultPinning;
  const setPinnedColumns = usePreferences((state) => state.setPinnedColumns);

  const table = useTable({
    features,
    columns,
    data,
    getRowId,
    state: { columnPinning, columnVisibility: getRowActions ? SHOW_ALL : HIDE_ACTIONS },
    onColumnPinningChange: (updater) =>
      setPinnedColumns(id, actionsLast(functionalUpdate(updater, columnPinning))),
  });
  const rows = table.getRowModel().rows;

  const pendingRowId = useRef<string | undefined>(undefined);
  const nativeMenu = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [menuRowId, setMenuRowId] = useState<string>();
  const [menuOpen, setMenuOpen] = useState(false);

  const actionsOf = (row: TData) => getRowActions?.(row) ?? NO_ACTIONS;
  const menuRow = menuRowId ? rows.find((row) => row.id === menuRowId) : undefined;

  const active = parseSort(sort);
  const startColumns = table.getStartVisibleLeafColumns();
  const centerColumns = table.getCenterVisibleLeafColumns();
  const startEdge = startColumns.at(-1)?.id;
  const endEdge = table.getEndVisibleLeafColumns()[0]?.id;
  // Spare width must land where it cannot shift a pinned column's offset.
  const growId = centerColumns.some((column) => column.id === growColumn)
    ? growColumn
    : (centerColumns.at(-1) ?? startColumns.at(-1))?.id;
  const firstColumnId = table.getAllLeafColumns()[0]?.id;
  const accentWidth = rowAccent ? ACCENT_WIDTH : 0;

  function pinning(column: Column<Features, TData, unknown>) {
    const side = column.getIsPinned();
    if (!side) return { className: undefined, style: undefined };
    return {
      className: cn(PINNED, column.id === startEdge && START_EDGE, column.id === endEdge && END_EDGE),
      style:
        side === "start"
          ? { insetInlineStart: accentWidth + column.getStart("start") }
          : { insetInlineEnd: column.getAfter("end") },
    };
  }

  function headerSort(columnId: string): HeaderSort | undefined {
    const entry = sortable[columnId];
    if (!entry) return undefined;
    const direction = entry.field === active.field ? (active.desc ? "desc" : "asc") : null;
    return {
      kind: entry.kind,
      direction,
      onSort: (desc) =>
        onSortChange(
          toSort(
            entry.field,
            desc ?? (direction ? direction === "asc" : SORT_KINDS[entry.kind].descFirst),
          ),
        ),
    };
  }

  function headerPin(column: Column<Features, TData, unknown>): HeaderPin | undefined {
    if (!column.getCanPin()) return undefined;
    return {
      pinned: column.getIsPinned(),
      canPinEnd: column.id !== firstColumnId,
      onPin: (side) => column.pin(side),
    };
  }

  function handlePointerDownCapture(event: PointerEvent) {
    // On macOS a right click selects the word under it, so judge the selection first.
    if (event.button === 2) nativeMenu.current = prefersNativeMenu(event.target as Element);
  }

  /** The row under an event, if it has a menu to open. */
  function menuTarget(target: EventTarget) {
    const rowId = rowIdOf(target);
    const row = rowId ? rows.find((candidate) => candidate.id === rowId) : undefined;
    return row && actionsOf(row.original).length > 0 ? row.id : undefined;
  }

  function handleContextMenuCapture(event: ReactMouseEvent) {
    const rowId = menuTarget(event.target);
    // Keyboard and long-press menus report button 0 and always get the row's menu.
    if (!rowId || (event.button === 2 && nativeMenu.current)) {
      // Stopped here, Base UI neither opens nor blocks the browser's own menu.
      event.stopPropagation();
      return;
    }
    pendingRowId.current = rowId;
    const focused = document.activeElement;
    // The trigger is not focusable, so closing would otherwise drop focus on the page.
    returnFocus.current =
      focused instanceof HTMLElement && event.currentTarget.contains(focused) ? focused : null;
  }

  function handleTouchStartCapture(event: TouchEvent) {
    // Read when a long press opens the menu; with no row there, the open is cancelled.
    pendingRowId.current = menuTarget(event.target);
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Shift+F10 opens a context menu on Windows; macOS has no key for it, so dispatch one.
    if (!(event.shiftKey && event.key === "F10")) return;
    const target = event.target as HTMLElement;
    if (!rowIdOf(target)) return;
    event.preventDefault();
    const { left, bottom } = target.getBoundingClientRect();
    target.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: left, clientY: bottom }),
    );
  }

  const cards = (
    <ul className="flex flex-col divide-y md:hidden">
      {rows.map((row) => {
        const accent = rowAccent?.(row.original);
        return (
          <li
            key={row.id}
            data-row-id={row.id}
            data-menu-open={menuOpen && menuRowId === row.id ? "" : undefined}
            className="relative p-4 transition-colors data-menu-open:bg-muted/50"
          >
            {accent && (
              <span aria-hidden="true" className={cn("absolute inset-y-0 start-0 w-1", accent)} />
            )}
            {renderCard(
              row.original,
              <RowActionsMenu groups={actionsOf(row.original)} label={getActionsLabel(row.original)} />,
            )}
          </li>
        );
      })}
    </ul>
  );

  const grid = (
    // Inline-size containment keeps the table's minimum width from stretching the page.
    <div
      ref={trackOverflow}
      className="group/scroll relative isolate hidden overflow-x-auto overscroll-x-contain contain-inline-size md:block"
    >
      <table
        data-slot="table"
        className="w-full table-fixed border-separate border-spacing-0 text-sm [--row-bg:var(--color-card)] [--row-hover:color-mix(in_oklab,var(--color-muted)_50%,var(--color-card))]"
        style={{ minWidth: table.getTotalSize() + accentWidth }}
      >
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent has-aria-expanded:bg-transparent">
              {rowAccent && (
                <TableHead
                  aria-hidden="true"
                  className={cn(PINNED, "start-0 h-10 border-b p-0")}
                  style={{ width: ACCENT_WIDTH }}
                />
              )}
              {group.headers.map((header) => {
                const column = header.column;
                const { className, style } = pinning(column);
                const sortState = headerSort(column.id);
                const pin = headerPin(column);
                const title = typeof column.columnDef.header === "string" ? column.columnDef.header : undefined;
                const align = column.columnDef.meta?.align ?? "start";
                return (
                  <TableHead
                    key={header.id}
                    scope="col"
                    // Names the column by its title alone, not the menu button's label too.
                    aria-label={title}
                    aria-sort={
                      sortState?.direction === "asc"
                        ? "ascending"
                        : sortState?.direction === "desc"
                          ? "descending"
                          : undefined
                    }
                    className={cn(
                      "group/head relative h-10 border-b px-4 text-xs font-medium text-muted-foreground",
                      align === "end" && "text-right",
                      // Touch screens always show the menu button, so keep the label clear of it.
                      pin && (align === "end" ? "pointer-coarse:ps-9" : "pointer-coarse:pe-9"),
                      column.columnDef.meta?.className,
                      className,
                    )}
                    style={{ width: column.id === growId ? undefined : header.getSize(), ...style }}
                  >
                    {header.isPlaceholder ? null : (
                      <ColumnHeader name={title ?? column.id} align={align} sort={sortState} pin={pin}>
                        <table.FlexRender header={header} />
                      </ColumnHeader>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="[&_tr:last-child>td]:border-b-0">
          {rows.map((row) => {
            const accent = rowAccent?.(row.original);
            return (
              <TableRow
                key={row.id}
                data-row-id={row.id}
                data-menu-open={menuOpen && menuRowId === row.id ? "" : undefined}
                className={ROW_BG}
              >
                {rowAccent && (
                  <TableCell
                    aria-hidden="true"
                    className={cn(PINNED, "start-0 border-b p-0", accent)}
                  />
                )}
                {row.getVisibleCells().map((cell) => {
                  const { className, style } = pinning(cell.column);
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "truncate border-b px-4",
                        density === "compact" ? "py-1.5" : "py-3",
                        cell.column.columnDef.meta?.align === "end" && "text-right",
                        cell.column.columnDef.meta?.className,
                        className,
                      )}
                      style={style}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </table>
    </div>
  );

  return (
    <RowActionsContext
      value={{
        // Only ever called with rows of this table.
        getActions: actionsOf as RowActionsContextValue["getActions"],
        getLabel: getActionsLabel as RowActionsContextValue["getLabel"],
      }}
    >
      <div aria-busy={isStale} className={cn("transition-opacity", isStale && "opacity-60")}>
        {getRowActions ? (
          <ContextMenu
            onOpenChange={(open, details) => {
              if (open && !pendingRowId.current) return details.cancel();
              if (open) setMenuRowId(pendingRowId.current);
              setMenuOpen(open);
            }}
          >
            <ContextMenuTrigger
              className="select-auto"
              onPointerDownCapture={handlePointerDownCapture}
              onContextMenuCapture={handleContextMenuCapture}
              onTouchStartCapture={handleTouchStartCapture}
              onKeyDown={handleKeyDown}
            >
              {cards}
              {grid}
            </ContextMenuTrigger>
            <ContextMenuContent finalFocus={() => returnFocus.current ?? true}>
              {menuRow && <RowActionItems groups={actionsOf(menuRow.original)} menu="context" />}
            </ContextMenuContent>
          </ContextMenu>
        ) : (
          <>
            {cards}
            {grid}
          </>
        )}
      </div>
    </RowActionsContext>
  );
}
