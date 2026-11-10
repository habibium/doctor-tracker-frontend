"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { PatientDoctor } from "@/lib/api";
import { doctorQueries } from "./queries";

const NO_DOCTORS: PatientDoctor[] = [];

interface DoctorComboboxProps {
  value: PatientDoctor | null;
  onChange: (doctor: PatientDoctor | null) => void;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}

/**
 * Finds a doctor by typing. With hundreds of doctors a plain select would have to
 * load them all, so each keystroke asks the API for the closest few instead.
 */
export function DoctorCombobox({
  value,
  onChange,
  id,
  placeholder = "Search doctors",
  invalid,
  className,
}: DoctorComboboxProps) {
  const [text, setText] = useState("");
  // Picking a doctor fills the box with their name; that should not narrow the list.
  const typed = value && text === value.name ? "" : text.trim();
  const search = useDebouncedValue(typed, 250);

  const { data, isFetching } = useQuery(
    doctorQueries.list({ page: 1, limit: 8, sort: "name", ...(search && { search }) }),
  );
  const doctors = data?.data ?? NO_DOCTORS;

  return (
    <Combobox
      items={doctors}
      // The API has already matched these, so the built-in text filter is bypassed.
      filteredItems={doctors}
      value={value}
      onValueChange={onChange}
      onInputValueChange={setText}
      itemToStringLabel={(doctor: PatientDoctor) => doctor.name}
      isItemEqualToValue={(a: PatientDoctor, b: PatientDoctor) => a.id === b.id}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        aria-invalid={invalid}
        showClear={Boolean(value)}
        className={className}
      />
      <ComboboxContent>
        <ComboboxEmpty>{isFetching ? "Searching…" : "No doctors match"}</ComboboxEmpty>
        <ComboboxList>
          {(doctor: PatientDoctor) => (
            <ComboboxItem key={doctor.id} value={doctor}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{doctor.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {doctor.specialization}, {doctor.hospital}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
