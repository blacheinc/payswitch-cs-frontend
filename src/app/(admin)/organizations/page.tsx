"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { organizationService, ORG_KEYS } from "@/lib/organization-service";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CODES } from "@/lib/constant";
import { NoPermission } from "@/components/shared/no-permission";

import { AddOrganizationModal } from "@/components/organization/add-organization-modal";
import { OrganizationTable } from "@/components/organization/organization-table";

export default function OrganizationsPage() {
  const { can } = usePermissions();
  const canRead = can(PERMISSION_CODES.ADMIN.ORGS_READ);
  const canCreate = can(PERMISSION_CODES.ADMIN.ORGS_CREATE);
  // ---- Search / filter / pagination state ----
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const debouncedSearch = useDebounce(searchInput);

  // ---- List query ----
  const { data, isLoading, isError } = useQuery({
    queryKey: ORG_KEYS.list({
      page,
      perPage,
      search: debouncedSearch,
      status: statusFilter,
    }),
    queryFn: () =>
      organizationService.list({
        page,
        perPage,
        search: debouncedSearch,
        status: statusFilter,
      }),
    enabled: canRead,
  });

  // ---- Add modal state ----
  const [isAddOpen, setIsAddOpen] = useState(false);

  if (!canRead) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage client organizations and their subscription tiers
          </p>
        </div>
        <NoPermission />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage client organizations and their subscription tiers
          </p>
        </div>

        {canCreate && (
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
        )}
      </div>

      {/* Orgs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>All Organizations</CardTitle>
            <div className="flex items-center gap-3">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v === "all" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <OrganizationTable
            data={data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Add Modal */}
      <AddOrganizationModal open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
