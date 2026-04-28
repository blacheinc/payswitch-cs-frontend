"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Canonical "rows per page" choices for every list view. Backend list
 * endpoints accept any value in [1, 100]; these four cover the typical
 * 10-row, 20-row (default), 50-row, and full-page-density buckets.
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Word used after the count, e.g. `total`, `items`, `requests`. */
  unitLabel?: string;
  /**
   * Optional per-page dropdown. Pass both `perPage` AND `onPerPageChange`
   * to enable it. Tables that don't expose page-size control can omit
   * these — the bar then renders just Page X of Y + Prev/Next.
   */
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
}

/**
 * Single, canonical pagination control for every list view across the app.
 * Layout: "Page X of Y (Z total)" on the left, optional "Show N per page"
 * dropdown plus Prev/Next on the right.
 *
 * Renders an empty fragment when there's nothing to page through AND no
 * size dropdown (so the bar doesn't take vertical space on a single-row
 * result). When `onPerPageChange` is wired, the bar always renders so
 * the user can jump to a smaller page size to surface pagination.
 */
export function TablePagination({
  page,
  totalPages,
  total,
  onPageChange,
  unitLabel = "total",
  perPage,
  onPerPageChange,
}: TablePaginationProps) {
  const showSizeDropdown =
    perPage !== undefined && onPerPageChange !== undefined;
  // Hide the bar entirely when there's nothing to do — a single-page result
  // with no size control is just visual noise.
  if (totalPages <= 1 && !showSizeDropdown) return null;

  return (
    <div className="flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} ({total} {unitLabel})
      </p>
      <div className="flex items-center gap-2">
        {showSizeDropdown && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Rows per page
            </span>
            <Select
              value={String(perPage)}
              onValueChange={(v) => onPerPageChange(Number(v))}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-[72px]"
                aria-label="Rows per page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
