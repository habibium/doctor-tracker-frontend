"use client";

import { type ReactNode, type RefCallback, useCallback, useId, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Cells sit on a 1px grid gap over the border colour, which draws a hairline between
 * every pair of neighbours however the grid wraps.
 */
export const BOARD = "grid gap-px overflow-hidden rounded-2xl border bg-border";

interface SectionProps {
  /** The question this part of the page answers. */
  title: string;
  description?: ReactNode;
  /** A control that scopes everything in the section. */
  action?: ReactNode;
  children: ReactNode;
  ref?: RefCallback<HTMLElement>;
}

export function Section({ title, description, action, children, ref }: SectionProps) {
  const id = useId();
  return (
    <section ref={ref} aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-0.5">
          <h2 id={id} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

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
    <div className={cn("flex min-w-0 flex-col gap-5 bg-card p-5 md:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
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

/** The nearest ancestor that scrolls vertically, or null when the document itself scrolls. */
function scrollParent(node: Element) {
  for (let element = node.parentElement; element; element = element.parentElement) {
    const { overflowY } = getComputedStyle(element);
    if ((overflowY === "auto" || overflowY === "scroll") && element.scrollHeight > element.clientHeight) {
      return element;
    }
  }
  return null;
}

/**
 * Turns true once the element comes within a screen of the viewport, and stays true.
 * Gates queries for panels far down the page; their skeletons hold the space meanwhile.
 */
export function useNearViewport<T extends Element>(): [RefCallback<T>, boolean] {
  const [near, setNear] = useState(false);
  const ref = useCallback((node: T | null) => {
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      // On desktop the page panel scrolls, not the window. The margin only widens the root,
      // and the panel clips what lies beyond it, so the panel itself has to be the root.
      { root: scrollParent(node), rootMargin: "100% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, near];
}
