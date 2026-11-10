"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce, useQueryStates } from "nuqs";
import { createColumns, DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { DensityToggle } from "@/components/data-table/density-toggle";
import { FilterSelect } from "@/components/data-table/filter-select";
import { LoadError, NoResults } from "@/components/data-table/list-states";
import { SearchInput } from "@/components/data-table/search-input";
import { LocalDate } from "@/components/local-date";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Doctor } from "@/lib/api";
import { formatNumber, initials } from "@/lib/format";
import { SORT_OPTIONS } from "@/lib/list-params";
import { DoctorRowActions } from "./doctor-actions";
import { doctorParams, toDoctorQuery } from "./params";
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

// Defined once at module scope: a new array each render would rebuild the table model.
const columns = [
  column.display({
    id: "doctor",
    header: "Doctor",
    cell: ({ row }) => <DoctorName doctor={row.original} />,
  }),
  column.accessor("specialization", {
    header: "Specialization",
    cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
  }),
  column.accessor("hospital", { header: "Hospital" }),
  column.accessor("phone", {
    header: "Phone",
    cell: ({ getValue }) => <span className="tabular">{getValue()}</span>,
  }),
  column.accessor("patientCount", {
    header: "Patients",
    cell: ({ getValue }) => <span className="tabular">{formatNumber(getValue())}</span>,
  }),
  column.accessor("createdAt", {
    header: "Added",
    cell: ({ getValue }) => <LocalDate value={getValue()} className="text-muted-foreground" />,
  }),
  column.display({
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <DoctorRowActions doctor={row.original} />,
  }),
];

// The table is fixed-layout, so these widths hold and long values truncate instead of
// pushing other columns around. Columns without a width share what is left.
const COLUMN_CLASSES = {
  doctor: "w-[27%]",
  specialization: "w-[17%] truncate",
  hospital: "truncate",
  phone: "hidden w-36 xl:table-cell",
  patientCount: "w-20 text-right",
  createdAt: "hidden w-28 lg:table-cell",
  actions: "w-12 text-right",
};

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <DoctorName doctor={doctor} />
        <DoctorRowActions doctor={doctor} />
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

      <div className="ml-auto flex items-center gap-2">
        <FilterSelect
          label="Sort order"
          value={params.sort}
          options={SORT_OPTIONS}
          onChange={(sort) => setParams({ sort, page: null })}
        />
        <DensityToggle />
      </div>
    </div>
  );
}

function DoctorsResults() {
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
      <DataTable
        columns={columns}
        data={data.data}
        columnClassNames={COLUMN_CLASSES}
        renderCard={(doctor) => <DoctorCard doctor={doctor} />}
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
  return (
    <div className="flex flex-col gap-4">
      <DoctorsToolbar />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <DoctorsResults />
      </div>
    </div>
  );
}
