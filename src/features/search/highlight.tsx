import type { ReactNode } from "react";
import { matchRanges } from "./match";

/** Marks the start of each word the search matched, as the API matches it. */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const ranges = matchRanges(text, terms);
  if (ranges.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    parts.push(
      text.slice(cursor, start),
      <mark key={start} className="rounded-sm bg-foreground/10 text-foreground">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  parts.push(text.slice(cursor));
  return parts;
}
