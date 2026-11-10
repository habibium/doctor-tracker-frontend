import { formatDate } from "@/lib/format";

/**
 * A date in the reader's time zone. The server renders it in its own zone, so the
 * text can differ by a day near midnight; the browser's value wins without a warning.
 */
export function LocalDate({ value, className }: { value: string; className?: string }) {
  return (
    <time dateTime={value} className={className} suppressHydrationWarning>
      {formatDate(value)}
    </time>
  );
}
