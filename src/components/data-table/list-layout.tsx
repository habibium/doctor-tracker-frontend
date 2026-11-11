import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ListLayoutProps {
  /**
   * Pins the card to the height of the page panel from `md` up, so the rows scroll
   * inside it and the toolbar, column headers and pagination stay put. The signed-in
   * layout looks for `data-fill-page` to stop the panel itself from scrolling.
   */
  fill?: boolean;
  /** The card's contents: toolbar, table, pagination. */
  children: ReactNode;
  /** Rendered beside the card, for dialogs that must outlive a row. */
  after?: ReactNode;
}

export function ListLayout({ fill = false, children, after }: ListLayoutProps) {
  return (
    <div
      data-fill-page={fill ? "" : undefined}
      // The floor keeps a few rows on screen in a short window; the panel scrolls instead.
      className={cn("flex flex-col", fill && "md:min-h-[26rem] md:flex-1")}
    >
      <div className="flex flex-col overflow-hidden rounded-2xl border bg-card md:min-h-0 md:flex-1">
        {children}
      </div>
      {after}
    </div>
  );
}

/** The card's first row: search, filters and view controls. */
export function ListToolbar({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 border-b px-3 py-2.5">{children}</div>;
}
