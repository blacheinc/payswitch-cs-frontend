"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { OrganizationResponse } from "@/types/organization-type";
import type { PaginatedResponse } from "@/types/api-type";

interface OrganizationTableProps {
  data: PaginatedResponse<OrganizationResponse> | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export function OrganizationTable({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
}: OrganizationTableProps) {
  const router = useRouter();
  const organizations = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return (
          <Badge variant="warning" className="capitalize">
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load organizations. Please try again.
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No organizations found.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Contact Name</TableHead>
            <TableHead>Contact Email</TableHead>
            <TableHead>Contact Phone</TableHead>
            <TableHead>Date Created</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{getInitials(org.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {org.shortName}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="capitalize">{org.industryType}</TableCell>
              <TableCell>{getStatusBadge(org.status)}</TableCell>
              <TableCell>{org.primaryContactName || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {org.primaryContactEmail || "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {org.primaryContactPhone || "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(org.createdAt), "MMM d, yyyy, h:mm a")}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(org.updatedAt), "MMM d, yyyy, h:mm a")}
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
                      onClick={() => router.push(`/organizations/${org.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({data?.total ?? 0} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
