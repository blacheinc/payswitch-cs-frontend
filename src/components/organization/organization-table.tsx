"use client";

import { useRouter } from "next/navigation";
import { Eye, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/shared/table-pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

import type { OrganizationResponse } from "@/types/organization-type";
import type { PaginatedResponse } from "@/types/api-type";
import { formatDate } from "@/lib/utils";

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
      <TableSkeleton
        bordered={false}
        headers={[
          "Organization",
          "Industry",
          "Status",
          "Contact Name",
          "Contact Email",
          "Contact Phone",
          "Date Created",
          "Last Updated",
          "",
        ]}
      />
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load organizations. Please try again.
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
          {organizations.length === 0 ? (
            <TableEmpty
              colSpan={9}
              title="No organizations found"
              description="There are no organizations to display. Add one to get started."
            />
          ) : (
            organizations.map((org) => (
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
                  {formatDate(org.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(org.updatedAt)}
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
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        onPageChange={onPageChange}
      />
    </>
  );
}
