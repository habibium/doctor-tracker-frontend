"use client";

import type { ReactNode } from "react";
import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface FilterSheetProps {
  /** Filters in effect, counted on the button. */
  activeCount: number;
  onClear: () => void;
  /** Closes the sheet and says what is behind it, e.g. "Show 42 doctors". */
  doneLabel: string;
  children: ReactNode;
}

/** Filters apply as they are changed; the sheet only holds the controls. */
export function FilterSheet({ activeCount, onClear, doneLabel, children }: FilterSheetProps) {
  const isMobile = useIsMobile();

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" className="shrink-0" />}>
        <SlidersHorizontalIcon data-icon="inline-start" />
        Filters
        {activeCount > 0 && (
          <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
            {activeCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        // Barely dimmed and never blurred: the list behind updates as filters change.
        overlayClassName="bg-black/15 supports-backdrop-filter:backdrop-blur-none"
        className="data-[side=bottom]:max-h-[85svh] data-[side=bottom]:rounded-t-3xl data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:w-[calc(100%-1rem)] data-[side=right]:rounded-2xl data-[side=right]:border"
      >
        <div
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 md:hidden"
        />
        <SheetHeader className="pb-4 max-md:pt-3">
          <SheetTitle>{isMobile ? "Sort and filter" : "Filters"}</SheetTitle>
          <SheetDescription>Changes apply straight away.</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-2">{children}</div>
        <SheetFooter className="flex-row border-t px-6 py-4">
          <Button variant="outline" disabled={activeCount === 0} onClick={onClear}>
            Clear all
          </Button>
          <SheetClose render={<Button className="flex-1" />}>{doneLabel}</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** One labelled control in the sheet. The control carries the same accessible name itself. */
export function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span aria-hidden="true" className="text-sm font-medium">
        {label}
      </span>
      {children}
    </div>
  );
}

export interface FilterChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

/** What the list is narrowed by, since the controls themselves sit in the sheet. */
export function ActiveFilters({ chips, onClear }: { chips: FilterChip[]; onClear: () => void }) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          aria-label={`Remove filter: ${chip.label} ${chip.value}`}
          onClick={chip.onRemove}
          className="group flex h-7 max-w-full items-center gap-1.5 rounded-full border bg-background pr-1.5 pl-2.5 text-xs outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-transparent"
        >
          <span className="text-muted-foreground">{chip.label}</span>
          <span className="truncate font-medium">{chip.value}</span>
          <XIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground"
          />
        </button>
      ))}
      <Button variant="ghost" size="xs" onClick={onClear}>
        Clear all
      </Button>
    </div>
  );
}
