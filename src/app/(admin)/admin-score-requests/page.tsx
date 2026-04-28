"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { TablePagination } from "@/components/shared/table-pagination";

import {
  scoreService,
  SCORE_KEYS,
  type ScoreDashboardPeriod,
} from "@/lib/score-service";
import {
  organizationService,
  ORG_KEYS,
} from "@/lib/organization-service";
import type { OrganizationResponse } from "@/types/organization-type";
import { AdminScoreRequestsTable } from "@/components/admin/admin-score-requests-table";
import { StatCard } from "@/components/shared/stat-card";
import { NoPermission } from "@/components/shared/no-permission";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { formatNumber, formatPct } from "@/lib/utils";
import { PERMISSION_CODES } from "@/lib/constant";

const PERIOD_OPTIONS: {
  value: ScoreDashboardPeriod;
  label: string;
  short: string;
}[] = [
  { value: "today", label: "Today", short: "today" },
  { value: "7d", label: "Last 7 days", short: "last 7 days" },
  { value: "30d", label: "Last 30 days", short: "last 30 days" },
  { value: "90d", label: "Last 90 days", short: "last 90 days" },
];

type TabValue = "all" | "by-org";

export default function AdminScoreRequestsPage() {
  const { can } = usePermissions();
  const canRead = can(PERMISSION_CODES.ADMIN.SCORE_REQUESTS_READ);

  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [period, setPeriod] = useState<ScoreDashboardPeriod>("30d");

  // Tab 1: All Score Requests state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);

  // Tab 2: By Organisation state
  const [selectedOrg, setSelectedOrg] =
    useState<{ id: string; name: string; shortName: string | null } | null>(null);
  const [orgPage, setOrgPage] = useState(1);
  const [orgPerPage, setOrgPerPage] = useState(10);
  const [orgSearch, setOrgSearch] = useState("");
  const debouncedOrgSearch = useDebounce(orgSearch);
  const [scopedPage, setScopedPage] = useState(1);
  const [scopedPerPage, setScopedPerPage] = useState(10);
  const [scopedSearch, setScopedSearch] = useState("");
  const debouncedScopedSearch = useDebounce(scopedSearch);

  // KPI scope follows the active tab + selection. When tab 2 has an org
  // selected, KPIs reflect THAT org so the user immediately sees the
  // scoped activity tile they care about. Otherwise platform-wide.
  const statsOrgId =
    activeTab === "by-org" && selectedOrg ? selectedOrg.id : undefined;

  const statsQuery = useQuery({
    queryKey: SCORE_KEYS.platformStats(period, statsOrgId),
    queryFn: () =>
      scoreService.getPlatformScoreRequestsStats(period, statsOrgId),
    refetchInterval: period === "today" ? 60_000 : 5 * 60_000,
    staleTime: period === "today" ? 30_000 : 2 * 60_000,
    refetchOnWindowFocus: false,
    enabled: canRead,
  });

  // Tab 1 — cross-org list
  const allListQuery = useQuery({
    queryKey: SCORE_KEYS.list({
      page,
      perPage,
      search: debouncedSearch,
    }),
    queryFn: () =>
      scoreService.getScoreRequests({
        page,
        perPage,
        search: debouncedSearch,
      }),
    enabled: canRead && activeTab === "all",
  });

  // Tab 2 — paginated org list (only fired when tab is open AND no org picked)
  const orgsQuery = useQuery({
    queryKey: ORG_KEYS.list({
      page: orgPage,
      perPage: orgPerPage,
      search: debouncedOrgSearch,
    }),
    queryFn: () =>
      organizationService.list({
        page: orgPage,
        perPage: orgPerPage,
        search: debouncedOrgSearch,
      }),
    enabled: canRead && activeTab === "by-org" && !selectedOrg,
  });

  // Tab 2 — score requests scoped to the selected org
  const scopedListQuery = useQuery({
    queryKey: SCORE_KEYS.list({
      page: scopedPage,
      perPage: scopedPerPage,
      search: debouncedScopedSearch,
      organizationId: selectedOrg?.id,
    }),
    queryFn: () =>
      scoreService.getScoreRequests({
        page: scopedPage,
        perPage: scopedPerPage,
        search: debouncedScopedSearch,
        organizationId: selectedOrg!.id,
      }),
    enabled: canRead && activeTab === "by-org" && !!selectedOrg,
  });

  const stats = statsQuery.data;
  const periodShort =
    PERIOD_OPTIONS.find((o) => o.value === period)?.short ?? period;
  const statsLoading = statsQuery.isLoading;

  if (!canRead) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Score Requests</h1>
          <p className="text-muted-foreground">
            Platform-wide credit score activity across all organisations.
          </p>
        </div>
        <NoPermission />
      </div>
    );
  }

  const needsAttention = stats
    ? stats.needs_attention.referred +
      stats.needs_attention.pending_or_processing +
      stats.needs_attention.failed
    : 0;

  const handleSelectOrg = (org: OrganizationResponse) => {
    setSelectedOrg({
      id: org.id,
      name: org.name,
      shortName: org.shortName ?? null,
    });
    // Reset the scoped table state so the new selection starts fresh.
    setScopedPage(1);
    setScopedSearch("");
  };

  const handleClearOrg = () => {
    setSelectedOrg(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Score Requests</h1>
          <p className="text-muted-foreground">
            {activeTab === "by-org" && selectedOrg
              ? `Activity scoped to ${selectedOrg.name}.`
              : "Platform-wide credit score activity across all organisations."}
          </p>
        </div>
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as ScoreDashboardPeriod)}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Time range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI tiles — scope follows the active tab + selected org. */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statsLoading || !stats ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label={`Requests · ${periodShort}`}
              value={formatNumber(stats.current.total_requests)}
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              description={
                stats.trend.total_delta_pct != null
                  ? `${stats.trend.total_delta_pct >= 0 ? "+" : ""}${stats.trend.total_delta_pct.toFixed(1)}% vs previous`
                  : `${formatNumber(stats.previous.total_requests)} previous`
              }
            />
            <StatCard
              label="Approval rate"
              value={
                stats.current.decided > 0
                  ? formatPct(stats.current.approval_rate_pct, 1)
                  : "—"
              }
              icon={<TrendingUp className="h-4 w-4 text-green-500" />}
              description={
                stats.trend.approval_delta_pp != null
                  ? `${stats.trend.approval_delta_pp >= 0 ? "+" : ""}${stats.trend.approval_delta_pp.toFixed(1)}pp vs previous`
                  : stats.current.decided > 0
                    ? `across ${formatNumber(stats.current.decided)} decisions`
                    : "no decisions yet"
              }
              tone={stats.current.decided > 0 ? "success" : "default"}
            />
            <StatCard
              label="Average credit score"
              value={stats.current.avg_credit_score ?? "—"}
              icon={<FileText className="h-4 w-4 text-primary" />}
              description={
                stats.current.median_credit_score != null
                  ? `median ${stats.current.median_credit_score}`
                  : "no scored requests"
              }
            />
            <StatCard
              label="Needs attention"
              value={formatNumber(needsAttention)}
              icon={
                <ShieldCheck
                  className={`h-4 w-4 ${needsAttention > 0 ? "text-yellow-500" : "text-green-500"}`}
                />
              }
              description={`${stats.needs_attention.referred} referred · ${stats.needs_attention.pending_or_processing} in flight · ${stats.needs_attention.failed} failed`}
              tone={needsAttention > 0 ? "warning" : "success"}
            />
          </>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="all">
            <FileText className="mr-2 h-4 w-4" />
            All Score Requests
          </TabsTrigger>
          <TabsTrigger value="by-org">
            <Building2 className="mr-2 h-4 w-4" />
            By Organisation
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: All Score Requests ───────────────────────────────── */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>All Score Requests</CardTitle>
                  <CardDescription>
                    Credit score evaluations submitted by registered organisations.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AdminScoreRequestsTable
                data={allListQuery.data}
                isLoading={allListQuery.isLoading}
                isError={allListQuery.isError}
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
        </TabsContent>

        {/* ─── Tab 2: By Organisation ──────────────────────────────────── */}
        <TabsContent value="by-org">
          {!selectedOrg ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Pick an organisation</CardTitle>
                    <CardDescription>
                      Select a tenant to scope the score-request list and KPIs above.
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search organisations..."
                      className="pl-9"
                      value={orgSearch}
                      onChange={(e) => {
                        setOrgSearch(e.target.value);
                        setOrgPage(1);
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <OrgPickerTable
                  data={orgsQuery.data}
                  isLoading={orgsQuery.isLoading}
                  isError={orgsQuery.isError}
                  page={orgPage}
                  onPageChange={setOrgPage}
                  perPage={orgPerPage}
                  onPerPageChange={(n) => {
                    setOrgPerPage(n);
                    setOrgPage(1);
                  }}
                  onSelect={handleSelectOrg}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearOrg}
                      className="shrink-0"
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      All organisations
                    </Button>
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        {selectedOrg.name}
                      </CardTitle>
                      <CardDescription>
                        Score requests for this organisation only.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search requests..."
                      className="pl-9"
                      value={scopedSearch}
                      onChange={(e) => {
                        setScopedSearch(e.target.value);
                        setScopedPage(1);
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AdminScoreRequestsTable
                  data={scopedListQuery.data}
                  isLoading={scopedListQuery.isLoading}
                  isError={scopedListQuery.isError}
                  page={scopedPage}
                  onPageChange={setScopedPage}
                  perPage={scopedPerPage}
                  onPerPageChange={(n) => {
                    setScopedPerPage(n);
                    setScopedPage(1);
                  }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================================================
// Org picker table — minimal three-column list with a chevron action.
// Intentionally NOT the shared `<OrganizationTable>` because that one's row
// click navigates to /organizations/{id}; we want it to set local state.
// =============================================================================

interface OrgPickerTableProps {
  data:
    | {
        items: OrganizationResponse[];
        total?: number;
        totalPages?: number;
      }
    | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onSelect: (org: OrganizationResponse) => void;
}

function OrgPickerTable({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
  perPage,
  onPerPageChange,
  onSelect,
}: OrgPickerTableProps) {
  const orgs = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  if (isLoading) {
    return (
      <TableSkeleton
        bordered={false}
        headers={["Organisation", "Industry", "Status", ""]}
      />
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load organisations. Please try again.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organisation</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orgs.length === 0 ? (
            <TableEmpty
              colSpan={4}
              title="No organisations found"
              description="Try a different search term."
            />
          ) : (
            orgs.map((org) => (
              <TableRow
                key={org.id}
                onClick={() => onSelect(org)}
                className="cursor-pointer"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {org.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{org.name}</span>
                      {org.shortName && (
                        <span className="text-xs text-muted-foreground truncate">
                          {org.shortName}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-sm text-muted-foreground">
                  {org.industryType}
                </TableCell>
                <TableCell>{getOrgStatusBadge(org.status)}</TableCell>
                <TableCell className="text-right">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
        unitLabel="organisations"
        perPage={perPage}
        onPerPageChange={onPerPageChange}
      />
    </>
  );
}

function getOrgStatusBadge(status: string) {
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
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16 mt-3" />
        <Skeleton className="h-3 w-32 mt-2" />
      </CardContent>
    </Card>
  );
}
