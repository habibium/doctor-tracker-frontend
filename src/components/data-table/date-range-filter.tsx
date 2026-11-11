"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { formatDate, fromDateParam, toDateParam } from "@/lib/format";
import { cn } from "@/lib/utils";

const DAY_MS = 86_400_000;

const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 12 months", days: 365 },
];

interface DateRangeFilterProps {
  /** `YYYY-MM-DD`, as stored in the URL. */
  from: string | null;
  to: string | null;
  onChange: (range: { from: string | null; to: string | null }) => void;
  /** What the date refers to, e.g. "Added" or "Registered". */
  label: string;
  className?: string;
}

/** "1 Nov 2026 to today": how an applied range is worded on the button and its chip. */
export const dateRangeLabel = (from: string | null, to: string | null) =>
  `${from ? formatDate(fromDateParam(from)) : "Any time"} to ${to ? formatDate(fromDateParam(to)) : "today"}`;

export function DateRangeFilter({ from, to, onChange, label, className }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  // Holds a half-picked range until the second day is chosen.
  const [draft, setDraft] = useState<DateRange | undefined>();

  const applied: DateRange | undefined =
    from || to
      ? { from: from ? fromDateParam(from) : undefined, to: to ? fromDateParam(to) : undefined }
      : undefined;
  const selected = draft ?? applied;
  const isActive = Boolean(from || to);

  function apply(range: { from: Date; to: Date } | null) {
    onChange(
      range ? { from: toDateParam(range.from), to: toDateParam(range.to) } : { from: null, to: null },
    );
    setDraft(undefined);
    setOpen(false);
  }

  function selectRange(range: DateRange | undefined) {
    if (range?.from && range.to) apply({ from: range.from, to: range.to });
    else setDraft(range);
  }

  function applyPreset(days: number) {
    const today = new Date();
    apply({ from: new Date(today.getTime() - (days - 1) * DAY_MS), to: today });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setDraft(undefined);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn("justify-start font-normal", !isActive && "text-muted-foreground", className)}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {isActive ? dateRangeLabel(from, to) : `${label} any time`}
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-auto flex-col p-0 sm:flex-row">
        <div className="flex flex-row flex-wrap gap-1 p-2 sm:flex-col sm:flex-nowrap">
          {PRESETS.map((preset) => (
            <Button
              key={preset.days}
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => applyPreset(preset.days)}
            >
              {preset.label}
            </Button>
          ))}
          {isActive && (
            <>
              <Separator className="my-1 hidden sm:block" />
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => apply(null)}>
                Clear dates
              </Button>
            </>
          )}
        </div>
        <Separator orientation="vertical" className="hidden sm:block" />
        <Calendar
          mode="range"
          selected={selected}
          onSelect={selectRange}
          defaultMonth={selected?.from}
          disabled={{ after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}
