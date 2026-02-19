// ==================== ORGANIZATION API TYPES ====================
// Types derived from OpenAPI spec for /admin/organizations endpoints.

// ---- Requests ----

/** POST /admin/organizations */
export interface CreateOrganizationRequest {
  name: string;
  shortName: string;
  industryType: string;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  address?: string | null;
}

/** PATCH /admin/organizations/{org_id} — all fields optional */
export interface UpdateOrganizationRequest {
  name?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  address?: string | null;
}

/** POST /admin/organizations/{org_id}/provision */
export interface ProvisionOrganizationRequest {
  callbackUrl?: string | null;
}

/** POST /admin/organizations/{org_id}/suspend */
export interface SuspendOrganizationRequest {
  reason: string;
}

// ---- Responses ----

/** Shape returned by GET/POST/PATCH org endpoints. */
export interface OrganizationResponse {
  id: string;
  name: string;
  shortName: string;
  industryType: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  address: string | null;
  status: string;
  suspensionReason: string | null;
  webhookSecret: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /admin/organizations/{org_id}/provision */
export interface ProvisionResponse {
  organization: OrganizationResponse;
  adminEmail: string;
  sandboxApiKey: string;
  productionApiKey: string;
  message: string;
}

/** GET /admin/organizations/{org_id}/users */
export interface OrgUserResponse {
  id: string;
  email: string;
  name: string;
  roleLabel: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}
