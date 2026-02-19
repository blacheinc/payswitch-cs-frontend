"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { organizationService, ORG_KEYS } from "@/lib/organization-service";

import { EditOrganizationModal } from "@/components/organization/edit-organization-modal";
import { SuspendOrganizationModal } from "@/components/organization/suspend-organization-modal";
import { ActivateConfirmModal } from "@/components/organization/activate-confirm-modal";
import { ProvisionOrganizationModal } from "@/components/organization/provision-organization-modal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  // ---- Fetch org ----
  const {
    data: org,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ORG_KEYS.detail(orgId),
    queryFn: () => organizationService.getById(orgId),
    enabled: !!orgId,
  });

  // ---- Modal state ----
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

          {/* Actions — visibility depends on status */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>

            {org.status === "pending" && (
              <Button onClick={() => setIsProvisionOpen(true)}>
                <Rocket className="mr-2 h-4 w-4" />
                Provision
              </Button>
            )}

            {org.status === "active" && (
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsSuspendOpen(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Suspend
              </Button>
            )}

            {org.status === "suspended" && (
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
              <Building2 className="h-5 w-5" />
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
                      {org.webhookSecret}
                    </code>
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
              <User className="h-5 w-5" />
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
