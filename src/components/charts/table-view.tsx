import type { ReactNode } from "react";
import { ChevronRightIcon } from "lucide-react";

/** Every figure behind a chart, as a table: the way to read values without hovering. */
export function TableView({ children }: { children: ReactNode }) {
  return (
    <details className="group text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md text-xs text-muted-foreground outline-none select-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon className="size-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
        Show as table
      </summary>
      <div className="mt-3 max-h-96 overflow-auto rounded-lg border">{children}</div>
    </details>
  );
}

export const TH = "sticky top-0 bg-muted px-3 py-2 text-left text-xs font-medium whitespace-nowrap text-muted-foreground";
export const TD = "tabular border-t px-3 py-1.5 text-right whitespace-nowrap";
