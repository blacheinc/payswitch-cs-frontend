"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  Lock,
  Unlock,
  Rocket,
  Building2,
  Mail,
  Phone,
  User,
  MapPin,
  Loader2,
  AlertCircleIcon,
  Copy,
  Check,
  Users,
  Eye,
  EyeOff,
  MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TablePagination } from "@/components/shared/table-pagination";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { organizationService, ORG_KEYS } from "@/lib/organization-service";
import { rbacService, RBAC_KEYS } from "@/lib/rbac-service";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CODES } from "@/lib/constant";
import { NoPermission } from "@/components/shared/no-permission";
import type { OrgUserResponse } from "@/types/organization-type";

import { EditOrganizationModal } from "@/components/organization/edit-organization-modal";
import { AdminEditUserModal } from "@/components/admin/admin-edit-user-modal";
import { SuspendOrganizationModal } from "@/components/organization/suspend-organization-modal";
import { ActivateConfirmModal } from "@/components/organization/activate-confirm-modal";
import { ProvisionOrganizationModal } from "@/components/organization/provision-organization-modal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const { can } = usePermissions();
  const canRead = can(PERMISSION_CODES.ADMIN.ORGS_READ);
  const canUpdate = can(PERMISSION_CODES.ADMIN.ORGS_UPDATE);
  const canSuspend = can(PERMISSION_CODES.ADMIN.ORGS_SUSPEND);
  const canProvision = can(PERMISSION_CODES.ADMIN.ORGS_PROVISION);

  // ---- Fetch org ----
  const {
    data: org,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ORG_KEYS.detail(orgId),
    queryFn: () => organizationService.getById(orgId),
    enabled: !!orgId && canRead,
  });

  // ---- Fetch users ----
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ORG_KEYS.users(orgId, { page: usersPage, perPage: usersPerPage }),
    queryFn: () =>
      organizationService.listUsers(orgId, {
        page: usersPage,
        perPage: usersPerPage,
      }),
    enabled: !!orgId && canRead,
  });

  const { data: rolesData } = useQuery({
    queryKey: RBAC_KEYS.roles(),
    queryFn: () => rbacService.listRoles(),
    enabled: !!orgId && canRead,
  });

  const roleNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rolesData?.items ?? []) {
      m.set(r.id, r.name);
    }
    return m;
  }, [rolesData?.items]);

  // ---- Modal state ----
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<OrgUserResponse | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success hover:bg-success/80">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return (
          <Badge variant="secondary" className="capitalize">
            {status}
          </Badge>
        );
    }
  };

  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "removed":
        return <Badge variant="destructive">Removed</Badge>;
      default:
        return (
          <Badge variant="warning" className="capitalize">
            {status}
          </Badge>
        );
    }
  };

  if (!canRead) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/organizations")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
        <NoPermission />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Back button + header — same vertical rhythm as the loaded view */}
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            className="w-fit"
            onClick={() => router.push("/organizations")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-56" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>

        {/* Two detail cards: Org Info + Primary Contact */}
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1].map((card) => (
            <Card key={card}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-sm" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row}>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    {row < 3 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users table card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-sm" />
              <Skeleton className="h-5 w-48" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !org) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">
          Failed to load organization details.
        </p>
        <Button variant="outline" onClick={() => router.push("/organizations")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/organizations")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl font-bold">
              {org.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{org.name}</h1>
                {getStatusBadge(org.status)}
              </div>
              <p className="text-sm text-muted-foreground">{org.shortName}</p>
            </div>
          </div>

          {/* Actions — visibility depends on status AND on RBAC perms */}
          <div className="flex items-center gap-2 flex-wrap">
            {canUpdate && (
              <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}

            {canProvision && org.status === "pending" && (
              <Button onClick={() => setIsProvisionOpen(true)}>
                <Rocket className="mr-2 h-4 w-4" />
                Provision
              </Button>
            )}

            {canSuspend && org.status === "active" && (
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsSuspendOpen(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Suspend
              </Button>
            )}

            {canSuspend && org.status === "suspended" && (
              <Button
                variant="outline"
                className="text-success border-success hover:bg-success/10"
                onClick={() => setIsActivateOpen(true)}
              >
                <Unlock className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* suspension reason */}

      {org.status === "suspended" && (
        <Alert variant="destructive" className="w-full">
          <AlertCircleIcon />
          <AlertTitle>Suspension Reason</AlertTitle>
          <AlertDescription>{org.suspensionReason}</AlertDescription>
        </Alert>
      )}

      {/* Details cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Organization Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Full Name" value={org.name} />
            <Separator />
            <DetailRow label="Short Name" value={org.shortName} />
            <Separator />
            <DetailRow
              label="Industry Type"
              value={org.industryType}
              capitalize
            />
            <Separator />
            <DetailRow label="Status" value={org.status} capitalize />

            {org.webhookSecret && (
              <>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Webhook Secret</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
                      {showSecret
                        ? org.webhookSecret
                        : "•".repeat(
                            Math.min(24, org.webhookSecret.length || 24),
                          )}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(org.webhookSecret!);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                      }}
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Primary Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              label="Name"
              value={org.primaryContactName}
              icon={<User className="h-4 w-4 text-muted-foreground" />}
            />
            <Separator />
            <DetailRow
              label="Email"
              value={org.primaryContactEmail}
              icon={<Mail className="h-4 w-4 text-muted-foreground" />}
            />
            <Separator />
            <DetailRow
              label="Phone"
              value={org.primaryContactPhone}
              icon={<Phone className="h-4 w-4 text-muted-foreground" />}
            />
            <Separator />
            <DetailRow
              label="Address"
              value={org.address}
              icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
            />
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Organization Users
            {usersData && (
              <Badge variant="secondary" className="ml-2">
                {usersData.total}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isUsersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !usersData?.items?.length ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No users found for this organization.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.items?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.roleId && roleNameById.has(user.roleId)
                            ? roleNameById.get(user.roleId)
                            : user.roleLabel.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>{getUserStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLoginAt
                            ? format(
                                new Date(user.lastLoginAt),
                                "MMM d, yyyy, h:mm a",
                              )
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {canUpdate ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingUser(user);
                                    setIsEditUserModalOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <TablePagination
                page={usersData.page}
                totalPages={usersData.totalPages}
                total={usersData.total}
                onPageChange={setUsersPage}
                perPage={usersPerPage}
                onPerPageChange={(n) => {
                  setUsersPerPage(n);
                  setUsersPage(1);
                }}
                unitLabel="users"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <EditOrganizationModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        organization={org}
      />

      <SuspendOrganizationModal
        open={isSuspendOpen}
        onOpenChange={setIsSuspendOpen}
        organizationId={orgId}
      />

      <ActivateConfirmModal
        open={isActivateOpen}
        onOpenChange={setIsActivateOpen}
        organizationId={orgId}
        organizationName={org.name}
      />

      <ProvisionOrganizationModal
        open={isProvisionOpen}
        onOpenChange={setIsProvisionOpen}
        organizationId={orgId}
        organizationName={org.name}
      />

      <AdminEditUserModal
        open={isEditUserModalOpen}
        onOpenChange={(open) => {
          setIsEditUserModalOpen(open);
          if (!open) {
            setTimeout(() => setEditingUser(null), 300);
          }
        }}
        orgId={orgId}
        user={editingUser}
      />
    </div>
  );
}

// ---- Helper component ----

function DetailRow({
  label,
  value,
  icon,
  capitalize,
}: {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {icon}
        <span
          className={`text-sm font-medium ${capitalize ? "capitalize" : ""}`}
        >
          {value || "—"}
        </span>
      </div>
    </div>
  );
}
