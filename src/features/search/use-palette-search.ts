import { useEffect, useState } from "react";
import {
  type QueryClient,
  type QueryKey,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { doctorQueries } from "@/features/doctors/queries";
import { patientQueries } from "@/features/patients/queries";
import type { Doctor, DoctorList, Patient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { doctorTokens, matchesAll, patientTokens, refines, searchTerms } from "./match";

export const MIN_SEARCH_LENGTH = 2;
/** The API's limit, as in `searchTerm` from list-params, which would pull nuqs into this chunk. */
const MAX_SEARCH_LENGTH = 100;
const RESULT_LIMIT = 5;
const PAUSE_MS = 200;

const listQuery = (search: string) => ({ search, limit: RESULT_LIMIT, page: 1, sort: "name" as const });

type ListPage<T> = { data: T[]; meta: DoctorList["meta"] };

interface Resource<T> {
  root: QueryKey;
  tokens: (row: T) => string[];
}

const DOCTORS: Resource<Doctor> = { root: queryKeys.doctors, tokens: doctorTokens };
const PATIENTS: Resource<Patient> = { root: queryKeys.patients, tokens: patientTokens };

function isPaletteKey(key: QueryKey): key is [string, "list", ReturnType<typeof listQuery>] {
  const params = key[2] as Record<string, unknown> | undefined;
  return (
    key[1] === "list" &&
    typeof params?.search === "string" &&
    params.limit === RESULT_LIMIT &&
    params.sort === "name" &&
    params.page === 1 &&
    Object.keys(params).length === 4
  );
}

/**
 * A cached result that holds every match for an earlier, broader search answers a
 * narrower one exactly: typing "farh" after "far" filters those rows, with no request.
 */
function refineFromCache<T>(client: QueryClient, resource: Resource<T>, search: string) {
  const terms = searchTerms(search);
  for (const [key, page] of client.getQueriesData<ListPage<T>>({ queryKey: [...resource.root, "list"] })) {
    if (!page || !isPaletteKey(key) || page.meta.total > page.data.length) continue;
    const state = client.getQueryState(key);
    if (!state || state.isInvalidated || !refines(terms, searchTerms(key[2].search))) continue;

    const data = page.data.filter((row) => matchesAll(terms, resource.tokens(row)));
    const meta = { ...page.meta, total: data.length, totalPages: data.length > 0 ? 1 : 0 };
    return { page: { data, meta }, updatedAt: state.dataUpdatedAt };
  }
  return undefined;
}

function isAnswerable<T>(client: QueryClient, resource: Resource<T>, search: string) {
  const key = [...resource.root, "list", listQuery(search)];
  return client.getQueryData(key) !== undefined || refineFromCache(client, resource, search) !== undefined;
}

/** Waits for a pause in typing, unless the cache can already answer the new term. */
function useSettledTerm(term: string, answerable: (term: string) => boolean) {
  const [settled, setSettled] = useState(term);
  const [previous, setPrevious] = useState(term);

  if (term !== previous) {
    setPrevious(term);
    if (answerable(term)) setSettled(term);
  }

  useEffect(() => {
    if (term === settled) return;
    const timer = setTimeout(() => setSettled(term), PAUSE_MS);
    return () => clearTimeout(timer);
  }, [term, settled]);

  return settled;
}

export type GroupResult<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "success"; rows: T[]; total: number; stale: boolean };

function toGroup<T>(
  query: UseQueryResult<ListPage<T>>,
  enabled: boolean,
  current: boolean,
): GroupResult<T> {
  if (!enabled) return { status: "idle" };
  if (query.data) {
    const stale = query.isPlaceholderData || !current;
    return { status: "success", rows: query.data.data, total: query.data.meta.total, stale };
  }
  if (query.isError) return { status: "error", retry: () => void query.refetch() };
  return { status: "loading" };
}

/**
 * Doctors and patients matching `input`, fetched in parallel. Superseded requests are
 * cancelled through the query's signal, and earlier results stay up until new ones land.
 */
export function usePaletteSearch(input: string) {
  const client = useQueryClient();
  const term = input.trim().slice(0, MAX_SEARCH_LENGTH);
  const settled = useSettledTerm(
    term,
    (next) =>
      next.length >= MIN_SEARCH_LENGTH &&
      isAnswerable(client, DOCTORS, next) &&
      isAnswerable(client, PATIENTS, next),
  );

  const enabled = term.length >= MIN_SEARCH_LENGTH && settled.length >= MIN_SEARCH_LENGTH;
  const doctorSeed = enabled ? refineFromCache(client, DOCTORS, settled) : undefined;
  const patientSeed = enabled ? refineFromCache(client, PATIENTS, settled) : undefined;

  const doctors = useQuery({
    ...doctorQueries.list(listQuery(settled)),
    enabled,
    initialData: doctorSeed?.page,
    initialDataUpdatedAt: doctorSeed?.updatedAt,
  });
  const patients = useQuery({
    ...patientQueries.list(listQuery(settled)),
    enabled,
    initialData: patientSeed?.page,
    initialDataUpdatedAt: patientSeed?.updatedAt,
  });

  const current = settled === term;
  return {
    term,
    settledTerm: settled,
    fetching: enabled && (doctors.isFetching || patients.isFetching),
    doctors: toGroup<Doctor>(doctors, enabled, current),
    patients: toGroup<Patient>(patients, enabled, current),
  };
}
