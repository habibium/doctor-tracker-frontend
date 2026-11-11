"use client";

import { ArrowDownUpIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SortableColumns, sortOptions, type SortValue } from "@/lib/list-params";

interface SortSelectProps<TField extends string> {
  sortable: SortableColumns<TField>;
  value: SortValue<TField>;
  onChange: (sort: SortValue<TField>) => void;
  className?: string;
}

/** Sorting for the card view, which has no column headers to click. */
export function SortSelect<TField extends string>({
  sortable,
  value,
  onChange,
  className,
}: SortSelectProps<TField>) {
  const options = sortOptions(sortable);

  return (
    <Select<SortValue<TField>>
      items={options}
      value={value}
      onValueChange={(next) => next && onChange(next)}
    >
      <SelectTrigger aria-label="Sort by" className={className}>
        <ArrowDownUpIcon aria-hidden="true" className="text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
