"use client";

import { type ReactNode, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConditionBar, ConditionCountsLine, ConditionKey } from "@/features/patients/condition-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Doctor } from "@/lib/api";
import { formatNumber, initials } from "@/lib/format";
import type { PinnedColumns } from "@/stores/preferences";
import { useDoctorRowActions } from "./doctor-actions";
import { DOCTOR_SORTABLE, doctorParams, toDoctorQuery } from "./params";
import { doctorQueries } from "./queries";

const column = createColumns<Doctor>();

function DoctorName({ doctor }: { doctor: Doctor }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar>
        <AvatarFallback>{initials(doctor.name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <Link
          href={`/doctors/${doctor.id}`}
          className="truncate font-medium underline-offset-4 hover:underline"
        >
          {doctor.name}
        </Link>
        <span className="truncate text-xs text-muted-foreground">{doctor.email}</span>
      </div>
    </div>
  );
}

/** The count and its split share a cell, so sorting by patients orders both. */
function PatientLoad({ doctor }: { doctor: Doctor }) {
  return (
    <div className="flex items-center gap-3">
      <span className="tabular w-9 shrink-0 text-right">{formatNumber(doctor.patientCount)}</span>
      <ConditionBar
        className="min-w-0 flex-1"
        counts={doctor.conditionCounts}
        label={`${doctor.name}'s patients`}
      />
    </div>
  );
}

// Defined once at module scope: a new array each render would rebuild the table model.
// Sizes are minimum widths in px; the table scrolls sideways when they do not fit.
const columns = [
  column.display({
    id: "doctor",
    header: "Doctor",
    cell: ({ row }) => <DoctorName doctor={row.original} />,
    size: 228,
  }),
  column.accessor("specialization", {
    header: "Specialization",
    cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
    size: 192,
  }),
  column.accessor("hospital", {
    header: "Hospital",
    cell: ({ getValue }) => <span className="line-clamp-2 leading-tight">{getValue()}</span>,
    size: 176,
    meta: { className: "whitespace-normal!" },
  }),
  column.accessor("phone", {
    header: "Phone",
    cell: ({ getValue }) => <span className="tabular">{getValue()}</span>,
    size: 148,
  }),
  column.accessor("patientCount", {
    header: "Patients",
    cell: ({ row }) => <PatientLoad doctor={row.original} />,
    size: 160,
  }),
  column.accessor("createdAt", {
    header: "Added",
    cell: ({ getValue }) => <LocalDate value={getValue()} className="text-muted-foreground" />,
    size: 120,
  }),
  actionsColumn<Doctor>(),
];

const DEFAULT_PINNING: PinnedColumns = { start: ["doctor"], end: ["actions"] };

function DoctorCard({ doctor, actions }: { doctor: Doctor; actions: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <DoctorName doctor={doctor} />
        {actions}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
        <Badge variant="secondary">{doctor.specialization}</Badge>
        <span>{doctor.hospital}</span>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Patients</dt>
          <dd className="tabular">{formatNumber(doctor.patientCount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Phone</dt>
          <dd className="tabular">{doctor.phone}</dd>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <dt className="text-xs text-muted-foreground">Patient mix</dt>
          <dd className="flex flex-col gap-2">
            <ConditionBar counts={doctor.conditionCounts} label={`${doctor.name}'s patients`} />
            <ConditionCountsLine counts={doctor.conditionCounts} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function DoctorsToolbar() {
  const [params, setParams] = useQueryStates(doctorParams);
  const { data: filters } = useQuery(doctorQueries.filters());

  const hasFilters = Boolean(
    params.search || params.specialization || params.hospital || params.from || params.to,
  );
  const toOptions = (values: string[] = []) => values.map((value) => ({ value, label: value }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        className="w-full sm:w-72"
        placeholder="Search name, hospital, phone or email"
        value={params.search}
        // The box updates on every keystroke; the URL catches up once typing pauses.
        onChange={(search) =>
          setParams({ search, page: null }, { limitUrlUpdates: debounce(300) })
        }
      />
      <FilterSelect
        label="Specialization"
        allLabel="All specializations"
        value={params.specialization}
        options={toOptions(filters?.specializations)}
        onChange={(specialization) => setParams({ specialization, page: null })}
      />
      <FilterSelect
        label="Hospital"
        allLabel="All hospitals"
        value={params.hospital}
        options={toOptions(filters?.hospitals)}
        onChange={(hospital) => setParams({ hospital, page: null })}
      />
      <DateRangeFilter
        label="Added"
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

function DoctorsResults({ getRowActions }: { getRowActions: (doctor: Doctor) => RowActionGroups }) {
  const [params, setParams] = useQueryStates(doctorParams);
  const queryClient = useQueryClient();

  // Search waits for a pause in typing; every other filter applies at once.
  const search = useDebouncedValue(params.search);
  const query = toDoctorQuery({ ...params, search });
  const { data, error, isPending, isPlaceholderData, refetch } = useQuery(doctorQueries.list(query));

  const page = data?.meta.page ?? 1;
  const totalPages = data?.meta.totalPages ?? 1;
  const nextPageKey = JSON.stringify({ ...query, page: page + 1 });

  useEffect(() => {
    // Warm the next page so moving forward feels instant.
    if (page < totalPages) void queryClient.prefetchQuery(doctorQueries.list(JSON.parse(nextPageKey)));
  }, [page, totalPages, nextPageKey, queryClient]);

  useEffect(() => {
    // A filter can shrink the list below the page in the URL; step back to the last page.
    if (data && data.data.length === 0 && data.meta.total > 0) {
      void setParams({ page: data.meta.totalPages });
    }
  }, [data, setParams]);

  if (isPending) return <DataTableSkeleton rows={params.limit} columns={6} />;
  if (!data) return <LoadError error={error} onRetry={() => void refetch()} />;

  if (data.data.length === 0) {
    const filtered = Object.keys(query).some((key) => !["page", "limit", "sort"].includes(key));
    return <NoResults noun="doctors" filtered={filtered} onClearFilters={() => setParams(null)} />;
  }

  return (
    <>
      <ListHeader total={data.meta.total} singular="doctor" plural="doctors">
        {/* Keys the bars in the Patients column; cards print their counts instead. */}
        <ConditionKey className="mr-2 hidden xl:flex" />
        <SortSelect
          sortable={DOCTOR_SORTABLE}
          value={params.sort}
          onChange={(sort) => setParams({ sort, page: null })}
        />
        <DensityToggle />
      </ListHeader>
      <DataTable
        id="doctors"
        columns={columns}
        data={data.data}
        defaultPinning={DEFAULT_PINNING}
        growColumn="hospital"
        sortable={DOCTOR_SORTABLE}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort, page: null })}
        getRowActions={getRowActions}
        getActionsLabel={(doctor) => `Actions for ${doctor.name}`}
        renderCard={(doctor, actions) => <DoctorCard doctor={doctor} actions={actions} />}
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

export function DoctorsView() {
  // Held here so an open dialog outlives its row, which can vanish once the list refetches.
  const rowActions = useDoctorRowActions();

  return (
    <div className="flex flex-col gap-4">
      <DoctorsToolbar />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <DoctorsResults getRowActions={rowActions.getActions} />
      </div>
      {rowActions.dialogs}
    </div>
  );
}
