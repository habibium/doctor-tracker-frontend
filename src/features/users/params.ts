import { createLoader, parseAsStringLiteral } from "nuqs/server";
import type { ListUsersData, User } from "@/lib/api";
import { dateRangeQuery, listParams, searchTerm, sortableColumns, sortParser } from "@/lib/list-params";

export const ROLE_VALUES: User["role"][] = ["admin", "viewer"];
export const STATUS_VALUES: User["status"][] = ["active", "deactivated"];

export type UserListQuery = NonNullable<ListUsersData["query"]>;
export type UserSort = NonNullable<UserListQuery["sort"]>;

/** Columns the API can sort by, keyed by column id; one line makes a header sortable. */
export const USER_SORTABLE = sortableColumns<UserSort>()({
  user: { field: "name", label: "Name", kind: "text" },
  role: { field: "role", label: "Role", kind: "text" },
  createdAt: { field: "createdAt", label: "Added", kind: "date" },
});

export const userParams = {
  ...listParams,
  sort: sortParser(USER_SORTABLE, "-createdAt"),
  role: parseAsStringLiteral(ROLE_VALUES),
  status: parseAsStringLiteral(STATUS_VALUES),
};

export const loadUserParams = createLoader(userParams);
export type UserParams = Awaited<ReturnType<typeof loadUserParams>>;

/** Server and browser both build the request here, so their query keys always match. */
export function toUserQuery(params: UserParams): UserListQuery {
  const search = searchTerm(params.search);
  return {
    page: Math.max(1, params.page),
    limit: params.limit,
    sort: params.sort,
    ...(search && { search }),
    ...(params.role && { role: params.role }),
    ...(params.status && { status: params.status }),
    ...dateRangeQuery(params.from, params.to),
  };
}
