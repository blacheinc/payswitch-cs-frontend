"use client";

import { format } from "date-fns";
import { Building2, Eye, Trash2, MoreVertical } from "lucide-react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { DataSourceResponse } from "@/types/training-type";
import type { PaginatedResponse } from "@/types/api-type";

interface DataSourceTableProps {
  data: PaginatedResponse<DataSourceResponse> | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onDelete?: (id: string) => void;
}

export function DataSourceTable({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
  perPage,
  onPerPageChange,
  onDelete,
}: DataSourceTableProps) {
  const router = useRouter();
  const sources = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return (
      <TableSkeleton
        bordered={false}
        headers={[
          "Source Name",
          "Short Code",
          "Type",
          "Total Uploads",
          "Last Upload",
          "Created",
          "Actions",
        ]}
      />
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load data sources. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Name</TableHead>
              <TableHead>Short Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total Uploads</TableHead>
              <TableHead>Last Upload</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.length === 0 ? (
              <TableEmpty
                colSpan={7}
                title="No data sources found"
                description="Add a data source to begin tracking training data uploads."
              />
            ) : (
              sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="font-medium">{source.name}</div>
                        {source.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {source.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px]"
                    >
                      {source.shortCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {source.sourceType.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {source.totalUploads}{" "}
                      {source.totalUploads === 1 ? "upload" : "uploads"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {source.lastUploadAt
                      ? format(new Date(source.lastUploadAt), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(source.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/training/sources/${source.id}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {onDelete && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(source.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Source
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        onPageChange={onPageChange}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
      />
    </>
  );
}
