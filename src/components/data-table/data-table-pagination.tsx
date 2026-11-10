"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaginationMeta } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { PAGE_SIZES } from "@/lib/list-params";

const SIZE_ITEMS = PAGE_SIZES.map((size) => ({ value: size, label: `${size} per page` }));

/** First, last, and the pages around the current one; `null` marks a gap. */
function pageWindow(current: number, total: number): (number | null)[] {
  const pages = [1, current - 1, current, current + 1, total].filter(
    (page, index, all) => page >= 1 && page <= total && all.indexOf(page) === index,
  );
  pages.sort((a, b) => a - b);

  return pages.flatMap((page, index) => {
    const previous = pages[index - 1];
    return previous !== undefined && page - previous > 1 ? [null, page] : [page];
  });
}

interface DataTablePaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: (typeof PAGE_SIZES)[number]) => void;
}

export function DataTablePagination({ meta, onPageChange, onLimitChange }: DataTablePaginationProps) {
  const { page, limit, total, totalPages } = meta;
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t px-4 py-3">
      <div className="flex items-center gap-3">
        <p className="tabular text-sm text-muted-foreground">
          {formatNumber(first)} to {formatNumber(last)} of {formatNumber(total)}
        </p>
        <Select
          items={SIZE_ITEMS}
          value={limit}
          onValueChange={(value) => onLimitChange(value as (typeof PAGE_SIZES)[number])}
        >
          <SelectTrigger size="sm" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SIZE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon />
            </Button>
          </PaginationItem>

          {pageWindow(page, totalPages).map((item, index) =>
            item === null ? (
              <PaginationItem key={`gap-${index}`} className="hidden sm:block">
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item} className={item === page ? undefined : "hidden sm:block"}>
                <Button
                  variant={item === page ? "outline" : "ghost"}
                  size="icon-sm"
                  className="tabular w-auto min-w-8 px-2"
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {formatNumber(item)}
                </Button>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
