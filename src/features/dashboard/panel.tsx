"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  description?: ReactNode;
  /** A control that scopes this panel, shown beside the title. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** One cell of the dashboard board. The board draws the hairlines between cells. */
export function Panel({ title, description, action, className, children }: PanelProps) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-5 bg-card p-5 md:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

interface QueryContentProps<T> {
  query: UseQueryResult<T>;
  /** Shown before the first result; size it like the finished content. */
  fallback: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * Renders a query's three states. While a newer result loads, the previous one stays
 * in place, dimmed, so charts never collapse and re-expand.
 */
export function QueryContent<T>({ query, fallback, children }: QueryContentProps<T>) {
  if (query.isPending) return fallback;

  if (query.data === undefined) {
    return (
      <div className="flex flex-col items-start gap-3 text-sm">
        <p className="text-muted-foreground">{errorMessage(query.error)}</p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          <RefreshCwIcon data-icon="inline-start" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div
      aria-busy={query.isPlaceholderData}
      className={cn("transition-opacity", query.isPlaceholderData && "opacity-60")}
    >
      {children(query.data)}
    </div>
  );
}
