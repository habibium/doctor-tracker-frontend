"use client";

import { type ReactNode, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/components/user-provider";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { User } from "@/lib/api";
import { formatNumber, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PinnedColumns } from "@/stores/preferences";
import { toUserQuery, USER_SORTABLE, userParams } from "./params";
import { userQueries } from "./queries";
import { ROLE_BY_VALUE, ROLES, RoleBadge, STATUS_LABELS, StatusLabel, YouBadge } from "./roles";
import { useUserRowActions } from "./user-actions";

const column = createColumns<User>();

function UserName({ user }: { user: User }) {
  const self = useUser().id === user.id;
  const deactivated = user.status === "deactivated";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className={cn(deactivated && "opacity-60")}>
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("truncate font-medium", deactivated && "text-muted-foreground")}>
            {user.name}
          </span>
          {self && <YouBadge className="shrink-0" />}
        </span>
        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
      </div>
    </div>
  );
}

// Defined once at module scope: a new array each render would rebuild the table model.
const columns = [
  column.display({
    id: "user",
    header: "User",
    cell: ({ row }) => <UserName user={row.original} />,
    size: 280,
  }),
  column.accessor("role", {
    header: "Role",
    cell: ({ getValue }) => <RoleBadge role={getValue()} />,
    size: 132,
  }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <StatusLabel status={getValue()} />,
    size: 148,
  }),
  column.accessor("createdAt", {
    header: "Added",
    cell: ({ getValue }) => <LocalDate value={getValue()} className="text-muted-foreground" />,
    size: 132,
  }),
  actionsColumn<User>(),
];

const DEFAULT_PINNING: PinnedColumns = { start: ["user"], end: ["actions"] };

function UserCard({ user, actions }: { user: User; actions: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <UserName user={user} />
        {actions}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <RoleBadge role={user.role} />
        <StatusLabel status={user.status} />
        <span className="text-xs text-muted-foreground">
          Added <LocalDate value={user.createdAt} />
        </span>
      </div>
    </div>
  );
}

/** The request behind the list, shared by the toolbar's count and the table. */
function useUserList() {
  const [params, setParams] = useQueryStates(userParams);
  // Search waits for a pause in typing; every other filter applies at once.
  const search = useDebouncedValue(params.search);
  return { params, setParams, search, query: toUserQuery({ ...params, search }) };
}

const roleOptions = ROLES.map(({ value, label, icon: Icon }) => ({
  value,
  label,
  icon: <Icon className="text-muted-foreground" />,
}));
const statusOptions = (Object.keys(STATUS_LABELS) as User["status"][]).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

function UsersToolbar() {
  const { params, setParams, query } = useUserList();
  const { data: total } = useQuery({ ...userQueries.list(query), select: (page) => page.meta.total });
  const clearFilters = () => setParams({ role: null, status: null, from: null, to: null, page: null });

  const chips: FilterChip[] = [];
  if (params.role) {
    chips.push({
      key: "role",
      label: "Role",
      value: ROLE_BY_VALUE[params.role].label,
      onRemove: () => void setParams({ role: null, page: null }),
    });
  }
  if (params.status) {
    chips.push({
      key: "status",
      label: "Status",
      value: STATUS_LABELS[params.status],
      onRemove: () => void setParams({ status: null, page: null }),
    });
  }
  if (params.from || params.to) {
    chips.push({
      key: "added",
      label: "Added",
      value: dateRangeLabel(params.from, params.to),
      onRemove: () => void setParams({ from: null, to: null, page: null }),
    });
  }

  return (
    <>
      <ListToolbar>
        <SearchInput
          className="min-w-0 flex-1"
          placeholder="Search name or email"
          value={params.search}
          // The box updates on every keystroke; the URL catches up once typing pauses.
          onChange={(search) => setParams({ search, page: null }, { limitUrlUpdates: debounce(300) })}
        />
        <FilterSheet
          activeCount={chips.length}
          onClear={() => void clearFilters()}
          doneLabel={
            total === undefined ? "Done" : `Show ${formatNumber(total)} ${total === 1 ? "user" : "users"}`
          }
        >
          <FilterField label="Sort by" className="md:hidden">
            <SortSelect
              className="w-full"
              sortable={USER_SORTABLE}
              value={params.sort}
              onChange={(sort) => setParams({ sort, page: null })}
            />
          </FilterField>
          <FilterField label="Role">
            <FilterSelect
              className="w-full"
              label="Role"
              allLabel="All roles"
              value={params.role}
              options={roleOptions}
              onChange={(role) => setParams({ role, page: null })}
            />
          </FilterField>
          <FilterField label="Status">
            <FilterSelect
              className="w-full"
              label="Status"
              allLabel="Active and deactivated"
              value={params.status}
              options={statusOptions}
              onChange={(status) => setParams({ status, page: null })}
            />
          </FilterField>
          <FilterField label="Date added">
            <DateRangeFilter
              className="w-full"
              label="Added"
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

function UsersResults({ getRowActions }: { getRowActions: (user: User) => RowActionGroups }) {
  const { params, setParams, search, query } = useUserList();
  const queryClient = useQueryClient();
  const { data, error, isPending, isPlaceholderData, refetch } = useQuery(userQueries.list(query));

  const page = data?.meta.page ?? 1;
  const totalPages = data?.meta.totalPages ?? 1;
  const nextPageKey = JSON.stringify({ ...query, page: page + 1 });

  useEffect(() => {
    // Warm the next page so moving forward feels instant.
    if (page < totalPages) void queryClient.prefetchQuery(userQueries.list(JSON.parse(nextPageKey)));
  }, [page, totalPages, nextPageKey, queryClient]);

  useEffect(() => {
    // A filter or a deletion can shrink the list below the page in the URL; step back.
    if (data && data.data.length === 0 && data.meta.total > 0) {
      void setParams({ page: data.meta.totalPages });
    }
  }, [data, setParams]);

  if (isPending) return <DataTableSkeleton rows={params.limit} columns={4} />;
  if (!data) return <LoadError error={error} onRetry={() => void refetch()} />;

  if (data.data.length === 0) {
    const filtered = Object.keys(query).some((key) => !["page", "limit", "sort"].includes(key));
    return <NoResults noun="users" filtered={filtered} onClearFilters={() => setParams(null)} />;
  }

  return (
    <>
      <DataTable
        id="users"
        columns={columns}
        data={data.data}
        defaultPinning={DEFAULT_PINNING}
        growColumn="createdAt"
        sortable={USER_SORTABLE}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort, page: null })}
        getRowActions={getRowActions}
        getActionsLabel={(user) => `Actions for ${user.name}`}
        renderCard={(user, actions) => <UserCard user={user} actions={actions} />}
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

export function UsersView() {
  // Held here so an open dialog outlives its row, which can vanish once the list refetches.
  const rowActions = useUserRowActions();

  return (
    <ListLayout fill after={rowActions.dialogs}>
      <UsersToolbar />
      <UsersResults getRowActions={rowActions.getActions} />
    </ListLayout>
  );
}
