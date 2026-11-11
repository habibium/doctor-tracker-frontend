"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce, useQueryStates } from "nuqs";
import { actionsColumn, createColumns, DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DateRangeFilter, dateRangeLabel } from "@/components/data-table/date-range-filter";
import { DensityToggle } from "@/components/data-table/density-toggle";
import { FilterSelect } from "@/components/data-table/filter-select";
import {
  ActiveFilters,
  type FilterChip,
  FilterField,
  FilterSheet,
} from "@/components/data-table/filter-sheet";
import { ListLayout, ListToolbar } from "@/components/data-table/list-layout";
import { LoadError, NoResults } from "@/components/data-table/list-states";
import type { RowActionGroups } from "@/components/data-table/row-actions";
import { SearchInput } from "@/components/data-table/search-input";
import { SortSelect } from "@/components/data-table/sort-select";
import { LocalDate } from "@/components/local-date";
import { analyticsQueries } from "@/features/dashboard/queries";
import { DoctorCombobox } from "@/features/doctors/doctor-combobox";
import { doctorQueries } from "@/features/doctors/queries";
import { SpecializationIcon } from "@/features/doctors/specialization";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Patient, PatientDoctor } from "@/lib/api";
import { formatNumber } from "@/lib/format";
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
      <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        <SpecializationIcon name={doctor.specialization} className="size-3.5 shrink-0" />
        <span className="truncate">{doctor.specialization}</span>
      </span>
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
    size: 196,
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
    size: 168,
  }),
  column.accessor("diagnosis", { header: "Diagnosis", size: 164 }),
  column.display({
    id: "doctor",
    header: "Doctor",
    cell: ({ row }) => <DoctorLink doctor={row.original.doctor} />,
    size: 192,
  }),
  column.accessor("createdAt", {
    header: "Registered",
    cell: ({ getValue }) => <LocalDate value={getValue()} className="text-muted-foreground" />,
    size: 120,
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
      className="w-full"
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

/** Lives inside the sheet, so the list of diagnoses is only fetched once someone opens it. */
function DiagnosisFilter({
  diagnosis,
  onChange,
}: {
  diagnosis: string | null;
  onChange: (diagnosis: string | null) => void;
}) {
  const { data } = useQuery(analyticsQueries.diagnoses());
  const options = (data ?? [])
    .map((row) => ({ value: row.diagnosis, label: row.diagnosis }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <FilterSelect
      className="w-full"
      label="Diagnosis"
      allLabel="All diagnoses"
      value={diagnosis}
      options={options}
      onChange={onChange}
    />
  );
}

/** The request behind the list, shared by the toolbar's count and the table. */
function usePatientList(doctorId?: string) {
  const [params, setParams] = useQueryStates(patientParams);
  // Search waits for a pause in typing; every other filter applies at once.
  const search = useDebouncedValue(params.search);
  const query = toPatientQuery({ ...params, search, doctorId: doctorId ?? params.doctorId });
  return { params, setParams, search, query };
}

function PatientsToolbar({ doctorId }: { doctorId?: string }) {
  const { params, setParams, query } = usePatientList(doctorId);
  const { data: total } = useQuery({ ...patientQueries.list(query), select: (page) => page.meta.total });
  const filterDoctorId = doctorId ? null : params.doctorId;
  const { data: filterDoctor } = useQuery({
    ...doctorQueries.detail(filterDoctorId ?? ""),
    enabled: Boolean(filterDoctorId),
  });

  const clearFilters = () =>
    setParams({
      condition: null,
      gender: null,
      diagnosis: null,
      from: null,
      to: null,
      page: null,
      ...(doctorId ? {} : { doctorId: null }),
    });

  const chips: FilterChip[] = [];
  if (params.condition) {
    chips.push({
      key: "condition",
      label: "Condition",
      value: CONDITION_BY_VALUE[params.condition].label,
      onRemove: () => void setParams({ condition: null, page: null }),
    });
  }
  if (params.gender) {
    chips.push({
      key: "gender",
      label: "Gender",
      value: GENDER_LABELS[params.gender],
      onRemove: () => void setParams({ gender: null, page: null }),
    });
  }
  if (params.diagnosis) {
    chips.push({
      key: "diagnosis",
      label: "Diagnosis",
      value: params.diagnosis,
      onRemove: () => void setParams({ diagnosis: null, page: null }),
    });
  }
  if (filterDoctorId) {
    chips.push({
      key: "doctor",
      label: "Doctor",
      value: filterDoctor?.name ?? "…",
      onRemove: () => void setParams({ doctorId: null, page: null }),
    });
  }
  if (params.from || params.to) {
    chips.push({
      key: "registered",
      label: "Registered",
      value: dateRangeLabel(params.from, params.to),
      onRemove: () => void setParams({ from: null, to: null, page: null }),
    });
  }

  return (
    <>
      <ListToolbar>
        <SearchInput
          className="min-w-0 flex-1"
          placeholder="Search name, diagnosis or phone"
          value={params.search}
          // The box updates on every keystroke; the URL catches up once typing pauses.
          onChange={(search) =>
            setParams({ search, page: null }, { limitUrlUpdates: debounce(300) })
          }
        />
        <FilterSheet
          activeCount={chips.length}
          onClear={() => void clearFilters()}
          doneLabel={
            total === undefined
              ? "Done"
              : `Show ${formatNumber(total)} ${total === 1 ? "patient" : "patients"}`
          }
        >
          <FilterField label="Sort by" className="md:hidden">
            <SortSelect
              className="w-full"
              sortable={PATIENT_SORTABLE}
              value={params.sort}
              onChange={(sort) => setParams({ sort, page: null })}
            />
          </FilterField>
          <FilterField label="Condition">
            <FilterSelect
              className="w-full"
              label="Condition"
              allLabel="All conditions"
              value={params.condition}
              options={CONDITIONS}
              onChange={(condition) => setParams({ condition, page: null })}
            />
          </FilterField>
          <FilterField label="Diagnosis">
            <DiagnosisFilter
              diagnosis={params.diagnosis}
              onChange={(diagnosis) => setParams({ diagnosis, page: null })}
            />
          </FilterField>
          <FilterField label="Gender">
            <FilterSelect
              className="w-full"
              label="Gender"
              allLabel="All genders"
              value={params.gender}
              options={GENDERS}
              onChange={(gender) => setParams({ gender, page: null })}
            />
          </FilterField>
          {!doctorId && (
            <FilterField label="Doctor">
              <DoctorFilter
                doctorId={params.doctorId}
                onChange={(next) => setParams({ doctorId: next, page: null })}
              />
            </FilterField>
          )}
          <FilterField label="Date registered">
            <DateRangeFilter
              className="w-full"
              label="Registered"
              from={params.from}
              to={params.to}
              onChange={(range) => setParams({ ...range, page: null })}
            />
          </FilterField>
        </FilterSheet>
        <DensityToggle />
      </ListToolbar>
      <ActiveFilters chips={chips} onClear={() => void clearFilters()} />
    </>
  );
}

interface PatientsResultsProps {
  doctorId?: string;
  getRowActions?: (patient: Patient) => RowActionGroups;
}

function PatientsResults({ doctorId, getRowActions }: PatientsResultsProps) {
  const { params, setParams, search, query } = usePatientList(doctorId);
  const queryClient = useQueryClient();
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
        resetScrollKey={data.meta.page}
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
    // On a doctor's page the list sits under the charts and the page scrolls as a whole.
    <ListLayout fill={!doctorId} after={rowActions.dialogs}>
      <PatientsToolbar doctorId={doctorId} />
      <PatientsResults doctorId={doctorId} getRowActions={rowActions.getActions} />
    </ListLayout>
  );
}
