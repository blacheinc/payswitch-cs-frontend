"use client";

import { useRouter } from "next/navigation";
import { FileSpreadsheet, Eye, Trash2, MoreVertical } from "lucide-react";

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

import type { TrainingUploadResponse } from "@/types/training-type";
import type { PaginatedResponse } from "@/types/api-type";
import { formatDate } from "@/lib/utils";

interface TrainingUploadTableProps {
  data: PaginatedResponse<TrainingUploadResponse> | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onDelete?: (id: string) => void;
}

export function TrainingUploadTable({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
  perPage,
  onPerPageChange,
  onDelete,
}: TrainingUploadTableProps) {
  const router = useRouter();
  const uploads = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "processed":
        return {
          variant: "outline" as const,
          className: "bg-green-50 text-green-700 border-green-200",
        };
      case "processing":
        return {
          variant: "outline" as const,
          className: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "failed":
        return {
          variant: "outline" as const,
          className: "bg-red-50 text-red-700 border-red-200",
        };
      default:
        return { variant: "outline" as const, className: "" };
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <TableSkeleton
        bordered={false}
        headers={[
          "File Name",
          "Source",
          "Format",
          "Size",
          "Records",
          "Quality",
          "Status",
          "Uploaded",
          "Actions",
        ]}
      />
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load datasets. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploads.length === 0 ? (
              <TableEmpty
                colSpan={9}
                title="No datasets found"
                description="Upload a dataset to get started with model training."
              />
            ) : (
              uploads.map((upload) => (
                <TableRow key={upload.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate max-w-[180px]">
                        {upload.fileName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {upload.dataSourceName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase"
                    >
                      {upload.fileFormat}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatFileSize(upload.fileSizeBytes)}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      {upload.recordCount > 0
                        ? upload.recordCount.toLocaleString()
                        : "—"}
                      {upload.validRecordCount > 0 &&
                        upload.validRecordCount !== upload.recordCount && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({upload.validRecordCount.toLocaleString()} valid)
                          </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {upload.qualityScore > 0 ? (
                      <div className="space-y-0.5">
                        <div
                          className={`text-sm font-medium ${getQualityColor(
                            upload.qualityScore,
                          )}`}
                        >
                          {upload.qualityScore}%
                        </div>
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {upload.featuresMapped}/{upload.targetFeaturesTotal}{" "}
                          features
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      {...getStatusBadgeStyle(upload.status)}
                      className={`capitalize ${getStatusBadgeStyle(upload.status).className}`}
                    >
                      {upload.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(upload.createdAt)}
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
                          onClick={() => router.push(`/training/${upload.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>

                        {onDelete && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(upload.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
