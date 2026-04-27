"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b bg-accent", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

interface TableEmptyProps {
  colSpan?: number;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

function TableEmpty({
  colSpan = 1,
  icon,
  title = "No results found",
  description = "There are no records to display.",
  className,
}: TableEmptyProps) {
  return (
    <TableRow className={cn("hover:bg-transparent", className)}>
      <TableCell colSpan={colSpan} className="h-48">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="text-muted-foreground/50">
            {icon ?? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground/70">{description}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

// =============================================================================
// Generic table skeleton.
//
// Two helpers — neither requires per-column configuration. The goal is a
// single drop-in loader that fits every table now and every table to come.
//
// • `<TableSkeleton>` — full table including `<TableHeader>`. Use it when the
//   consumer's loading branch is an early return:
//
//       if (isLoading) {
//         return (
//           <TableSkeleton
//             headers={["Request ID", "Applicant", "Status", "Score", "Risk",
//                       "Decision", "Date", ""]}
//           />
//         );
//       }
//
// • `<TableSkeletonRows>` — placeholder rows only. Drop them inside an
//   existing `<TableBody>` so the same `<TableHeader>` is shared between
//   loading and loaded states (no header reflow):
//
//       <TableBody>
//         {isLoading
//           ? <TableSkeletonRows columns={8} />
//           : items.map(item => <TableRow>...</TableRow>)}
//       </TableBody>
//
// Both inherit the existing `<Table>` chrome (wrapper, `overflow-x-auto`),
// so they stay responsive on narrow viewports.
// =============================================================================

export interface TableSkeletonRowsProps {
  /** How many columns each placeholder row should have. */
  columns: number;
  /** Number of placeholder rows to render. Default 8. */
  rows?: number;
}

function TableSkeletonRows({ columns, rows = 8 }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow
          key={`skeleton-${rowIdx}`}
          className="hover:bg-transparent"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <TableCell key={colIdx}>
              <Skeleton className="h-4 w-3/4 max-w-[160px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export interface TableSkeletonProps {
  /**
   * Column header labels. Length determines the number of columns in each
   * placeholder row. Use empty strings (`""`) for icon-only columns.
   */
  headers: React.ReactNode[];
  /** Number of placeholder rows to render. Default 8. */
  rows?: number;
  /** Wrap in `rounded-md border` to mirror the typical loaded-table chrome. */
  bordered?: boolean;
  /** `className` applied to the outer wrapper. */
  className?: string;
}

function TableSkeleton({
  headers,
  rows = 8,
  bordered = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn(bordered && "rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, i) => (
              <TableHead key={i}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSkeletonRows columns={headers.length} rows={rows} />
        </TableBody>
      </Table>
    </div>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableEmpty,
  TableSkeleton,
  TableSkeletonRows,
};
