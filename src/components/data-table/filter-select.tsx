"use client";

import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option<T extends string> {
  value: T;
  label: string;
  /** Shown before the label in the list. */
  icon?: ReactNode;
}

interface FilterSelectProps<T extends string> {
  /** Names the control for screen readers, e.g. "Specialization". */
  label: string;
  /** Shown when nothing is selected, e.g. "All specializations". */
  allLabel?: string;
  value: T | null;
  options: readonly Option<T>[];
  onChange: (value: T | null) => void;
  className?: string;
}

export function FilterSelect<T extends string>({
  label,
  allLabel,
  value,
  options,
  onChange,
  className,
}: FilterSelectProps<T>) {
  const items: { value: T | null; label: string; icon?: ReactNode }[] = allLabel
    ? [{ value: null, label: allLabel }, ...options]
    : [...options];

  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(next as T | null)}>
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value ?? "all"} value={item.value}>
              {item.icon}
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
