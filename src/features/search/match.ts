import type { Doctor, Patient } from "@/lib/api";

/*
 * Mirrors the API's search (`src/lib/search.ts` in the backend): every query word must
 * prefix-match a word of the record. Local commands, highlighting and cache refinement
 * all use it, so what the palette shows always agrees with what the server would return.
 */

const WORD = /[\p{L}\p{M}\p{N}]+/gu;
const MAX_TERMS = 5;

export function tokenize(...values: string[]) {
  return values.flatMap((value) => value.toLowerCase().match(WORD) ?? []);
}

/** Distinct query words, capped as the API caps them. */
export function searchTerms(query: string) {
  return [...new Set(tokenize(query))].slice(0, MAX_TERMS);
}

export function matchesAll(terms: string[], tokens: string[]) {
  return terms.every((term) => tokens.some((token) => token.startsWith(term)));
}

/** `[start, end)` of each word prefix in `text` that a term matches, longest term first. */
export function matchRanges(text: string, terms: string[]) {
  const ranges: [number, number][] = [];
  if (terms.length === 0) return ranges;
  for (const { 0: word, index } of text.matchAll(WORD)) {
    const lower = word.toLowerCase();
    // Lowercasing can change the length of a few scripts; offsets would then be wrong.
    if (lower.length !== word.length) continue;
    const length = Math.max(0, ...terms.filter((term) => lower.startsWith(term)).map((t) => t.length));
    if (length > 0) ranges.push([index, index + length]);
  }
  return ranges;
}

/** True when every result for `next` is also a result for `previous`. */
export function refines(next: string[], previous: string[]) {
  return previous.every((term) => next.some((word) => word.startsWith(term)));
}

function phoneTokens(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return [];
  return digits.startsWith("880") ? [digits, digits.slice(2)] : [digits];
}

export const doctorTokens = (doctor: Doctor) => [
  ...tokenize(doctor.name, doctor.specialization, doctor.hospital, doctor.email),
  ...phoneTokens(doctor.phone),
];

export const patientTokens = (patient: Patient) => [
  ...tokenize(patient.name, patient.diagnosis),
  ...phoneTokens(patient.phone),
];
