import {
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { fromDateParam } from "@/lib/format";

export const PAGE_SIZES = [10, 20, 50] as const;

/** How a column's values read, which sets the wording and the direction of a first click. */
export type SortKind = "text" | "date" | "number" | "severity";

export const SORT_KINDS: Record<SortKind, { asc: string; desc: string; descFirst: boolean }> = {
  text: { asc: "A to Z", desc: "Z to A", descFirst: false },
  date: { asc: "Oldest first", desc: "Newest first", descFirst: true },
  number: { asc: "Lowest first", desc: "Highest first", descFirst: true },
  severity: { asc: "Stable first", desc: "Critical first", descFirst: true },
};

/** Fields the API sorts both ways: `name` when the generated union holds `name` and `-name`. */
export type SortField<TSort extends string, TAll extends string = TSort> = TSort extends `-${infer F}`
  ? F extends TAll
    ? F
    : never
  : never;

export interface SortableColumn<TField extends string = string> {
  field: TField;
  label: string;
  kind: SortKind;
}

/** Keyed by column id. A column with no entry has a plain, non-sortable header. */
export type SortableColumns<TField extends string = string> = Readonly<
  Record<string, SortableColumn<TField>>
>;

/** A sort as the URL and the API spell it: `name`, or `-name` for descending. */
export type SortValue<TField extends string = string> = TField | `-${TField}`;

/** Checks each entry's field against a list's generated `sort` union. */
export const sortableColumns =
  <TSort extends string>() =>
  <T extends SortableColumns<SortField<TSort>>>(columns: T) =>
    columns;

/**
 * Accepts each sortable field in both directions and nothing else, so a hand-edited
 * URL falls back to `fallback` instead of sending the API a key it rejects.
 */
export function sortParser<TField extends string>(
  columns: SortableColumns<TField>,
  fallback: SortValue<TField>,
) {
  const values = Object.values(columns).flatMap(({ field }) => [toSort(field, false), toSort(field, true)]);
  return parseAsStringLiteral(values).withDefault(fallback);
}

export const parseSort = (sort: string) =>
  sort.startsWith("-") ? { field: sort.slice(1), desc: true } : { field: sort, desc: false };

export const toSort = <TField extends string>(field: TField, desc: boolean): SortValue<TField> =>
  desc ? `-${field}` : field;

/** Both directions of every sortable column, for the card view, which has no headers. */
export function sortOptions<TField extends string>(columns: SortableColumns<TField>) {
  return Object.values(columns).flatMap(({ field, label, kind }) => {
    const { asc, desc, descFirst } = SORT_KINDS[kind];
    const options = [
      { value: toSort(field, false), label: `${label}, ${asc.toLowerCase()}` },
      { value: toSort(field, true), label: `${label}, ${desc.toLowerCase()}` },
    ];
    return descFirst ? options.reverse() : options;
  });
}

/**
 * URL state shared by every list. Values outside the allowed set fall back to the
 * default, so a hand-edited URL can never send the API an invalid request. Each list
 * adds its own `sort`, since the sortable fields differ.
 */
export const listParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsNumberLiteral(PAGE_SIZES).withDefault(10),
  search: parseAsString.withDefault(""),
  from: parseAsString,
  to: parseAsString,
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
