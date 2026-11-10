"use client";

import type { ReactNode } from "react";
import { RefreshCwIcon, SearchXIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { errorMessage } from "@/lib/api";

export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>This didn&apos;t load</EmptyTitle>
        <EmptyDescription>{errorMessage(error)}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCwIcon data-icon="inline-start" />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}

interface NoResultsProps {
  /** Plural noun for what the list holds, e.g. "doctors". */
  noun: string;
  /** True when search or filters narrowed the list to nothing. */
  filtered: boolean;
  onClearFilters: () => void;
  /** Shown when the list is empty with no filters, e.g. an "Add doctor" button. */
  action?: ReactNode;
}

export function NoResults({ noun, filtered, onClearFilters, action }: NoResultsProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{filtered ? `No ${noun} match` : `No ${noun} yet`}</EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "Try a different search or remove a filter."
            : `New ${noun} will appear here.`}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {filtered ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          action
        )}
      </EmptyContent>
    </Empty>
  );
}
