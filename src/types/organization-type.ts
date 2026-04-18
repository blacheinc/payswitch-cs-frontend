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
  /** Legacy org seat label (admin, viewer, …) when returned by API */
  roleLabel: string;
  /** Assigned RBAC role id when returned by API */
  roleId?: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

/** POST /org/users — invite a new user to the organization */
export interface InviteUserRequest {
  email: string;
  name: string;
  /** RBAC role UUID from GET /v1/roles (org-scoped). */
  roleId: string;
  /** Selected RBAC role display name sent as legacy label for compatibility. */
  roleLabel: string;
  callbackUrl?: string | null;
}

/** PATCH /org/users/{user_id} — update a user's name or role */
export interface UpdateUserRequest {
  name?: string | null;
  /** Replace the user's RBAC role assignment (null clears to server default). */
  roleId?: string | null;
}
