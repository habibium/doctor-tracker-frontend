import {
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { fromDateParam } from "@/lib/format";

export const PAGE_SIZES = [10, 20, 50] as const;

export const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "name", label: "Name, A to Z" },
  { value: "-name", label: "Name, Z to A" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/**
 * URL state shared by every list. Values outside the allowed set fall back to the
 * default, so a hand-edited URL can never send the API an invalid request.
 */
export const listParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsNumberLiteral(PAGE_SIZES).withDefault(10),
  search: parseAsString.withDefault(""),
  from: parseAsString,
  to: parseAsString,
  sort: parseAsStringLiteral(SORT_OPTIONS.map((option) => option.value)).withDefault("-createdAt"),
};

/** The API rejects longer searches, so a pasted paragraph is cut rather than refused. */
export const searchTerm = (search: string) => search.trim().slice(0, 100);

const OBJECT_ID = /^[0-9a-f]{24}$/i;
/** Drops an id that could not be a record id, such as one mangled in a copied link. */
export const recordId = (id: string | null) => (id && OBJECT_ID.test(id) ? id : undefined);

const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;
const isDateParam = (value: string | null): value is string =>
  value !== null && DATE_PARAM.test(value);

/**
 * Turns the URL's local calendar days into exact instants, so "today" means the
 * visitor's today rather than a UTC day.
 */
export function dateRangeQuery(from: string | null, to: string | null) {
  const range: { from?: string; to?: string } = {};
  if (isDateParam(from)) range.from = fromDateParam(from).toISOString();
  if (isDateParam(to)) {
    const end = fromDateParam(to);
    end.setHours(23, 59, 59, 999);
    range.to = end.toISOString();
  }
  return range;
}

export const hasDateRange = (params: { from: string | null; to: string | null }) =>
  isDateParam(params.from) || isDateParam(params.to);
