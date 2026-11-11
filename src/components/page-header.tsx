import type { ReactNode } from "react";
import { PageMotif, type PageMotifName } from "@/components/page-motif";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  primaryAction,
  motif,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Secondary page-level actions, shown to the right of the title on every screen. */
  children?: ReactNode;
  /**
   * The page's main action. One instance only: beside the title on desktop, pinned into
   * the mobile top bar below `md`, so its dialog is never mounted twice.
   */
  primaryAction?: ReactNode;
  motif?: PageMotifName;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pt-1 md:min-h-16">
      {motif && <PageMotif name={motif} />}
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="max-w-prose text-sm text-pretty text-muted-foreground">{description}</p>
        )}
      </div>
      {(children || primaryAction) && (
        // With nothing else beside it, the pinned action must not leave an empty row behind.
        <div className={cn("flex items-center gap-2", !children && "max-md:contents")}>
          {children}
          {primaryAction && (
            <div
              data-primary-action=""
              className="flex items-center gap-2 max-md:fixed max-md:top-2.5 max-md:right-4 max-md:z-30"
            >
              {primaryAction}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
