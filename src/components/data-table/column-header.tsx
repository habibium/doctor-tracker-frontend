"use client";

import type { ReactNode } from "react";
import {
  ArrowDownIcon,
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  EllipsisVerticalIcon,
  PinIcon,
  PinOffIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SORT_KINDS, type SortKind } from "@/lib/list-params";
import { cn } from "@/lib/utils";

export type PinSide = "start" | "end";

export interface HeaderSort {
  kind: SortKind;
  /** Null when the list is sorted by another column. */
  direction: "asc" | "desc" | null;
  /** Without `desc`, sorts the way a header click should: reverse if active, else the kind's first direction. */
  onSort: (desc?: boolean) => void;
}

export interface HeaderPin {
  pinned: PinSide | false;
  canPinEnd: boolean;
  onPin: (side: PinSide | false) => void;
}

interface ColumnHeaderProps {
  children: ReactNode;
  /** Plain-text column name for labels, e.g. "Doctor". */
  name: string;
  /** "end" for numbers: the label sits over the right edge of the values. */
  align?: "start" | "end";
  sort?: HeaderSort;
  pin?: HeaderPin;
}

export function ColumnHeader({ children, name, align = "start", sort, pin }: ColumnHeaderProps) {
  const SortIcon =
    sort?.direction === "asc" ? ArrowUpIcon : sort?.direction === "desc" ? ArrowDownIcon : ArrowUpDownIcon;

  return (
    <div className={cn("flex min-w-0 items-center gap-1", align === "end" && "flex-row-reverse")}>
      {sort ? (
        <button
          type="button"
          onClick={() => sort.onSort()}
          className={cn(
            "-mx-1.5 inline-flex h-7 min-w-0 items-center gap-1 rounded-lg px-1.5 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30",
            align === "end" && "flex-row-reverse",
            sort.direction && "text-foreground",
          )}
        >
          <span className="truncate">{children}</span>
          <SortIcon
            aria-hidden="true"
            className={cn(
              "size-3.5 shrink-0 transition-opacity",
              sort.direction
                ? "text-brand-mint"
                : "opacity-0 group-hover/head:opacity-60 group-focus-within/head:opacity-60",
            )}
          />
        </button>
      ) : (
        <span className="truncate">{children}</span>
      )}
      {pin?.pinned && <PinIcon aria-hidden="true" className="size-3 shrink-0 text-brand-mint" />}
      {pin && <ColumnMenu name={name} align={align} sort={sort} pin={pin} />}
    </div>
  );
}

/** Overlays the header's far edge so it costs no width until it is needed. */
function ColumnMenu({
  name,
  align,
  sort,
  pin,
}: {
  name: string;
  align: "start" | "end";
  sort?: HeaderSort;
  pin: HeaderPin;
}) {
  const { pinned, canPinEnd, onPin } = pin;
  const directions = sort ? SORT_KINDS[sort.kind] : null;
  const label = pinned
    ? `${name} column options, pinned ${pinned === "start" ? "left" : "right"}`
    : `${name} column options`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 bg-(--row-bg) text-muted-foreground opacity-0 group-hover/head:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 pointer-coarse:opacity-100",
              align === "end" ? "start-1.5" : "end-1.5",
            )}
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align === "end" ? "start" : "end"} className="w-auto">
        {sort && directions && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sort</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sort.direction ?? ""}
                onValueChange={(value) => sort.onSort(value === "desc")}
              >
                <DropdownMenuRadioItem value="asc">
                  <ArrowUpIcon />
                  {directions.asc}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">
                  <ArrowDownIcon />
                  {directions.desc}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          {sort && <DropdownMenuLabel>Pin</DropdownMenuLabel>}
          {pinned !== "start" && (
            <DropdownMenuItem onClick={() => onPin("start")}>
              <ArrowLeftToLineIcon />
              Pin to left
            </DropdownMenuItem>
          )}
          {canPinEnd && pinned !== "end" && (
            <DropdownMenuItem onClick={() => onPin("end")}>
              <ArrowRightToLineIcon />
              Pin to right
            </DropdownMenuItem>
          )}
          {pinned && (
            <DropdownMenuItem onClick={() => onPin(false)}>
              <PinOffIcon />
              Unpin
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
