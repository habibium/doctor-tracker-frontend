"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce, useQueryStates } from "nuqs";
import { actionsColumn, createColumns, DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { DensityToggle } from "@/components/data-table/density-toggle";
import { FilterSelect } from "@/components/data-table/filter-select";
import { ListHeader } from "@/components/data-table/list-header";
import { LoadError, NoResults } from "@/components/data-table/list-states";
import type { RowActionGroups } from "@/components/data-table/row-actions";
import { SearchInput } from "@/components/data-table/search-input";
import { SortSelect } from "@/components/data-table/sort-select";
import { LocalDate } from "@/components/local-date";
import { Button } from "@/components/ui/button";
import { DoctorCombobox } from "@/features/doctors/doctor-combobox";
import { doctorQueries } from "@/features/doctors/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Patient, PatientDoctor } from "@/lib/api";
import type { PinnedColumns } from "@/stores/preferences";
import { CONDITION_BY_VALUE, ConditionBadge, CONDITIONS, GENDER_LABELS, GENDERS } from "./conditions";
import { PATIENT_SORTABLE, patientParams, toPatientQuery } from "./params";
import { usePatientRowActions } from "./patient-actions";
import { patientQueries } from "./queries";

const column = createColumns<Patient>();

function PatientName({ patient }: { patient: Patient }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-medium">{patient.name}</span>
      <span className="tabular truncate text-xs text-muted-foreground">{patient.phone}</span>
    </div>
  );
}

function DoctorLink({ doctor }: { doctor: PatientDoctor | null }) {
  if (!doctor) return <span className="text-muted-foreground">Unassigned</span>;
  return (
    <div className="flex min-w-0 flex-col">
      <Link href={`/doctors/${doctor.id}`} className="truncate underline-offset-4 hover:underline">
        {doctor.name}
      </Link>
      <span className="truncate text-xs text-muted-foreground">{doctor.specialization}</span>
    </div>
  );
}

// Defined once at module scope: a new array each render would rebuild the table model.
// Sizes are minimum widths in px; the table scrolls sideways when they do not fit.
const columns = [
  column.display({
    id: "patient",
    header: "Patient",
    cell: ({ row }) => <PatientName patient={row.original} />,
    size: 208,
  }),
  column.accessor("age", {
    header: "Age",
    cell: ({ getValue }) => <span className="tabular">{getValue()}</span>,
    size: 76,
    meta: { align: "end" },
  }),
  column.accessor("gender", {
    header: "Gender",
    cell: ({ getValue }) => GENDER_LABELS[getValue()],
    size: 96,
  }),
  column.accessor("condition", {
    header: "Condition",
    cell: ({ getValue }) => <ConditionBadge condition={getValue()} />,
    size: 176,
  }),
  column.accessor("diagnosis", { header: "Diagnosis", size: 176 }),
  column.display({
    id: "doctor",
    header: "Doctor",
    cell: ({ row }) => <DoctorLink doctor={row.original.doctor} />,
    size: 188,
  }),
  column.accessor("createdAt", {
    header: "Registered",
    cell: ({ getValue }) => <LocalDate value={getValue()} className="text-muted-foreground" />,
    size: 128,
  }),
  actionsColumn<Patient>(),
];

/** On a doctor's own page every row has the same doctor, so that column is dropped. */
const columnsWithoutDoctor = columns.filter((item) => item.id !== "doctor");

const DEFAULT_PINNING: PinnedColumns = { start: ["patient"], end: ["actions"] };

/** The row's leading edge takes the condition colour; the Condition column names it. */
const conditionAccent = (patient: Patient) => CONDITION_BY_VALUE[patient.condition].fill;

interface PatientCardProps {
  patient: Patient;
  showDoctor: boolean;
  actions: ReactNode;
}

function PatientCard({ patient, showDoctor, actions }: PatientCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <PatientName patient={patient} />
        {actions}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <ConditionBadge condition={patient.condition} />
        <span className="text-muted-foreground">
          {GENDER_LABELS[patient.gender]}, {patient.age}
        </span>
      </div>
      <p className="text-sm">{patient.diagnosis}</p>
      {showDoctor && (
        <div className="text-sm">
          <DoctorLink doctor={patient.doctor} />
        </div>
      )}
    </div>
  );
}

/** The URL holds only the doctor's id, so the name is looked up for display. */
function DoctorFilter({
  doctorId,
  onChange,
}: {
  doctorId: string | null;
  onChange: (doctorId: string | null) => void;
}) {
  const [picked, setPicked] = useState<PatientDoctor | null>(null);
  const { data } = useQuery({
    ...doctorQueries.detail(doctorId ?? ""),
    enabled: Boolean(doctorId) && picked?.id !== doctorId,
  });

  const value = !doctorId ? null : picked?.id === doctorId ? picked : (data ?? null);

  return (
    <DoctorCombobox
      className="w-full sm:w-56"
      label="Doctor"
      placeholder="All doctors"
      value={value}
      onChange={(doctor) => {
        setPicked(doctor);
        onChange(doctor?.id ?? null);
      }}
    />
  );
}

function PatientsToolbar({ scoped }: { scoped: boolean }) {
  const [params, setParams] = useQueryStates(patientParams);

  const hasFilters = Boolean(
    params.search ||
      params.condition ||
      params.gender ||
      params.from ||
      params.to ||
      (!scoped && params.doctorId),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        className="w-full sm:w-72"
        placeholder="Search name, diagnosis or phone"
        value={params.search}
        // The box updates on every keystroke; the URL catches up once typing pauses.
        onChange={(search) =>
          setParams({ search, page: null }, { limitUrlUpdates: debounce(300) })
        }
      />
      <FilterSelect
        label="Condition"
        allLabel="All conditions"
        value={params.condition}
        options={CONDITIONS}
        onChange={(condition) => setParams({ condition, page: null })}
      />
      <FilterSelect
        label="Gender"
        allLabel="All genders"
        value={params.gender}
        options={GENDERS}
        onChange={(gender) => setParams({ gender, page: null })}
      />
      {!scoped && (
        <DoctorFilter
          doctorId={params.doctorId}
          onChange={(doctorId) => setParams({ doctorId, page: null })}
        />
      )}
      <DateRangeFilter
        label="Registered"
        from={params.from}
        to={params.to}
        onChange={(range) => setParams({ ...range, page: null })}
      />
      {hasFilters && (
        <Button variant="ghost" onClick={() => setParams(null)}>
          Clear filters
        </Button>
      )}

    </div>
  );
}

interface PatientsResultsProps {
  doctorId?: string;
  getRowActions?: (patient: Patient) => RowActionGroups;
}

function PatientsResults({ doctorId, getRowActions }: PatientsResultsProps) {
  const [params, setParams] = useQueryStates(patientParams);
  const queryClient = useQueryClient();

  // Search waits for a pause in typing; every other filter applies at once.
  const search = useDebouncedValue(params.search);
  const query = toPatientQuery({ ...params, search, doctorId: doctorId ?? params.doctorId });
  const { data, error, isPending, isPlaceholderData, refetch } = useQuery(
    patientQueries.list(query),
  );

  const page = data?.meta.page ?? 1;
  const totalPages = data?.meta.totalPages ?? 1;
  const nextPageKey = JSON.stringify({ ...query, page: page + 1 });

  useEffect(() => {
    // Warm the next page so moving forward feels instant.
    if (page < totalPages) {
      void queryClient.prefetchQuery(patientQueries.list(JSON.parse(nextPageKey)));
    }
  }, [page, totalPages, nextPageKey, queryClient]);

  useEffect(() => {
    // Deleting the last row of the last page, or narrowing a filter, can leave the
    // URL on a page that no longer exists; step back to the last real one.
    if (data && data.data.length === 0 && data.meta.total > 0) {
      void setParams({ page: data.meta.totalPages });
    }
  }, [data, setParams]);

  if (isPending) return <DataTableSkeleton rows={params.limit} columns={6} />;
  if (!data) return <LoadError error={error} onRetry={() => void refetch()} />;

  if (data.data.length === 0) {
    const ignored = ["page", "limit", "sort", ...(doctorId ? ["doctorId"] : [])];
    const filtered = Object.keys(query).some((key) => !ignored.includes(key));
    return <NoResults noun="patients" filtered={filtered} onClearFilters={() => setParams(null)} />;
  }

  return (
    <>
      <ListHeader total={data.meta.total} singular="patient" plural="patients">
        <SortSelect
          sortable={PATIENT_SORTABLE}
          value={params.sort}
          onChange={(sort) => setParams({ sort, page: null })}
        />
        <DensityToggle />
      </ListHeader>
      <DataTable
        id="patients"
        columns={doctorId ? columnsWithoutDoctor : columns}
        data={data.data}
        defaultPinning={DEFAULT_PINNING}
        growColumn="diagnosis"
        sortable={PATIENT_SORTABLE}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort, page: null })}
        getRowActions={getRowActions}
        getActionsLabel={(patient) => `Actions for ${patient.name}`}
        rowAccent={conditionAccent}
        renderCard={(patient, actions) => (
          <PatientCard patient={patient} showDoctor={!doctorId} actions={actions} />
        )}
        isStale={isPlaceholderData || search !== params.search}
      />
      <DataTablePagination
        meta={data.meta}
        onPageChange={(next) => setParams({ page: next })}
        onLimitChange={(limit) => setParams({ limit, page: null })}
      />
    </>
  );
}

/** Pass `doctorId` to show one doctor's patients, as on the doctor profile page. */
export function PatientsView({ doctorId }: { doctorId?: string }) {
  // Held here so the delete dialog outlives its row, which is removed as soon as it is confirmed.
  const rowActions = usePatientRowActions();

  return (
    <div className="flex flex-col gap-4">
      <PatientsToolbar scoped={Boolean(doctorId)} />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <PatientsResults doctorId={doctorId} getRowActions={rowActions.getActions} />
      </div>
      {rowActions.dialogs}
    </div>
  );
}
