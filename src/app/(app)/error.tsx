"use client";

import { LoadError } from "@/components/data-table/list-states";

/** Catches anything a page throws while rendering, inside the app shell. */
export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <LoadError error={error} onRetry={reset} />
    </div>
  );
}
