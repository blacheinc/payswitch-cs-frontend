// Inactivity timeout in milliseconds (5 minutes)
export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

export const TABLE_ITEM_PER_PAGE = 10;

// Routes
export const ROUTES = {
  AUTH: {
    LOGIN: "/login",
    ADMIN_LOGIN: "/admin-login",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
  },
  ADMIN: {
    DASHBOARD: "/admin-dashboard",
    ORGANIZATIONS: "/organizations",
    TRAINING: "/training",
    SCORE_REQUESTS: "/admin-score-requests",
    SCORING_ENGINE: "/scoring-engine",
    MONITORING: "/admin-monitoring",
    ACCESS_CONTROL: "/admin-access-control",
    SETTINGS: "/admin-settings",
  },
  ORG: {
    DASHBOARD: "/dashboard",
    SCORE_REQUESTS: "/score-requests",
    // DEVELOPERS module is temporarily hidden. To restore: rename the folder
    // src/app/(org)/_developers → developers and uncomment the route below.
    // DEVELOPERS: "/developers",
    TEAMS: "/teams",
    SETTINGS: "/settings",
  },
};

/**
 * Route-prefix arrays used by the proxy/middleware to classify every request
 * into an audience. Keep these in sync with the sidebar navigation — any new
 * admin or org route must be added here so scope isolation stays enforced.
 */
export const ADMIN_ROUTE_PREFIXES: readonly string[] = Object.values(
  ROUTES.ADMIN,
);
export const ORG_ROUTE_PREFIXES: readonly string[] = Object.values(ROUTES.ORG);

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    ME_PERMISSIONS: "/auth/me/permissions",
    VERIFY_2FA: "/auth/2fa/verify",
    SETUP_2FA: "/auth/2fa/setup",
    REMOVE_2FA: "/auth/2fa/remove",
    CHANGE_PASSWORD: "/auth/change-password",
    VERIFY_EMAIL: "/auth/verify-email",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  SCORE_REQUESTS: {
    BASE: "/v1/score-requests",
    STATS: "/v1/score-requests/stats",
    BY_ID: (id: string) => `/v1/score-requests/${id}`,
    SCORING_RESULT: (id: string) => `/v1/score-requests/${id}/scoring-result`,
    OVERRIDE: (id: string) => `/v1/score-requests/${id}/override`,
    OUTCOME: (id: string) => `/v1/score-requests/${id}/outcome`,
    PERFORMANCE: (id: string) => `/v1/score-requests/${id}/performance`,
  },
  BUREAU: {
    LOOKUP: "/v1/bureau-lookup",
  },
  BATCH_SCORING: {
    BASE: "/v1/score/batch",
    BY_ID: (jobId: string) => `/v1/score/batch/${jobId}`,
    RESULTS: (jobId: string) => `/v1/score/batch/${jobId}/results`,
    CANCEL: (jobId: string) => `/v1/score/batch/${jobId}/cancel`,
  },
  USAGE: "/v1/usage",
  HEALTH: "/health", // Specific endpoint from spec
  READY: "/ready", // Specific endpoint from spec
  ADMIN: {
    ORGANIZATIONS: "/admin/organizations",
    PROVISION: (id: string) => `/admin/organizations/${id}/provision`,
    SUSPEND: (id: string) => `/admin/organizations/${id}/suspend`,
    ACTIVATE: (id: string) => `/admin/organizations/${id}/activate`,
    ORG_USERS: (orgId: string) => `/admin/organizations/${orgId}/users`,
    ORG_USER_BY_ID: (orgId: string, userId: string) =>
      `/admin/organizations/${orgId}/users/${userId}`,
    SOURCES: "/admin/sources",
    SOURCE_BY_ID: (id: string) => `/admin/sources/${id}`,
    SOURCE_UPLOADS: (id: string) => `/admin/sources/${id}/uploads`,
    TRAINING_DATA: "/admin/training-data",
    TRAINING_BY_ID: (id: string) => `/admin/training-data/${id}`,
    TRAINING_STATUS: (id: string) => `/admin/training-data/${id}/status`,

    UPLOAD_TRAINING: "/admin/training-data/upload",
    API_LOGS: "/admin/api-logs",
    ADMINS: "/admin/admins",
    ADMIN_BY_ID: (id: string) => `/admin/admins/${id}`,
    SUSPEND_ADMIN: (id: string) => `/admin/admins/${id}/suspend`,
    ACTIVATE_ADMIN: (id: string) => `/admin/admins/${id}/activate`,
  },
  MODELS: {
    CURRENT: "/v1/models/current",
  },
  RULES: {
    EVALUATE: "/v1/rules/evaluate",
  },
  RBAC: {
    PERMISSIONS: "/v1/permissions",
    ROLES: "/v1/roles",
    ROLE_BY_ID: (id: string) => `/v1/roles/${id}`,
  },
  MONITORING: {
    INFRASTRUCTURE: "/v1/monitoring/infrastructure",
    RISK: "/v1/monitoring/risk",
    MODEL_OPS: "/v1/monitoring/model-ops",
    COMPLIANCE: "/v1/monitoring/compliance",
    ALERTS: "/v1/monitoring/alerts",
  },
  ORG: {
    PROFILE: "/org/profile",
    USERS: "/org/users",
    USER_BY_ID: (userId: string) => `/org/users/${userId}`,
    SUSPEND_USER: (userId: string) => `/org/users/${userId}/suspend`,
    ACTIVATE_USER: (userId: string) => `/org/users/${userId}/activate`,
    API_KEYS: "/org/api-keys",
    API_KEY_BY_ID: (keyId: string) => `/org/api-keys/${keyId}`,
    WEBHOOKS: "/org/webhooks",
    WEBHOOK_EVENTS: "/org/webhooks/events",
    WEBHOOK_BY_ID: (webhookId: string) => `/org/webhooks/${webhookId}`,
    LOGS: "/org/api-logs",
  },
};

export const SOURCE_TYPE_ENUM = {
  BANK: {
    value: "bank",
    label: "Bank",
  },
  BUREAU: {
    value: "bureau",
    label: "Bureau",
  },
  TELCO: {
    value: "telco",
    label: "Telco",
  },
  UTILITY: {
    value: "utility",
    label: "Utility",
  },
  MFI: {
    value: "mfi",
    label: "MFI",
  },
  OTHER: {
    value: "other",
    label: "Other",
  },
};

export const INDUSTRY_TYPE_ENUM = {
  BANK: {
    value: "bank",
    label: "Bank",
  },
  FINTECH: {
    value: "fintech",
    label: "Fintech",
  },
  MFI: {
    value: "mfi",
    label: "Microfinance Bank",
  },
  SACCO: {
    value: "sacco",
    label: "SACCO",
  },
  OTHER: {
    value: "other",
    label: "Other",
  },
};

// RBAC Permission Codes
export const PERMISSION_CODES = {
  // Platform-scoped (admin dashboard)
  ADMIN: {
    ORGS_CREATE: "admin.organizations.create",
    ORGS_READ: "admin.organizations.read",
    ORGS_UPDATE: "admin.organizations.update",
    ORGS_PROVISION: "admin.organizations.provision",
    ORGS_SUSPEND: "admin.organizations.suspend",
    TRAINING_UPLOAD: "admin.training_data.upload",
    TRAINING_READ: "admin.training_data.read",
    TRAINING_APPROVE: "admin.training_data.approve",
    SOURCES_MANAGE: "admin.sources.manage",
    SOURCES_READ: "admin.sources.read",
    ROLES_READ: "admin.roles.read",
    ROLES_MANAGE: "admin.roles.manage",
    ROLES_ASSIGN: "admin.roles.assign",
    // Platform-admin member management
    ADMINS_INVITE: "admin.admins.invite",
    ADMINS_LIST: "admin.admins.list",
    ADMINS_READ: "admin.admins.read",
    ADMINS_UPDATE: "admin.admins.update",
    ADMINS_SUSPEND: "admin.admins.suspend",
    ADMINS_DELETE: "admin.admins.delete",
    API_LOGS_READ: "admin.api_logs.read",
  },
  MONITORING: {
    RISK: "monitoring.risk",
    INFRASTRUCTURE: "monitoring.infrastructure",
    MODEL_OPS: "monitoring.model_ops",
    COMPLIANCE: "monitoring.compliance",
    ALERTS: "monitoring.alerts",
  },
  MODELS: {
    READ: "models.read",
  },
  RULES: {
    EVALUATE: "rules.evaluate",
  },
  // Org-scoped (organization dashboard)
  SCORE_REQUESTS: {
    CREATE: "score_requests.create",
    LIST: "score_requests.list",
    READ: "score_requests.read",
    OVERRIDE: "score_requests.override",
    REPORT_OUTCOME: "score_requests.report_outcome",
    REPORT_PERFORMANCE: "score_requests.report_performance",
  },
  BATCH_SCORING: {
    CREATE: "batch_scoring.create",
    LIST: "batch_scoring.list",
    READ: "batch_scoring.read",
    CANCEL: "batch_scoring.cancel",
  },
  USERS: {
    INVITE: "users.invite",
    LIST: "users.list",
    UPDATE: "users.update",
    SUSPEND: "users.suspend",
    DELETE: "users.delete",
  },
  API_KEYS: {
    CREATE: "api_keys.create",
    LIST: "api_keys.list",
    REVOKE: "api_keys.revoke",
  },
  WEBHOOKS: {
    MANAGE: "webhooks.manage",
    LIST: "webhooks.list",
  },
  API_LOGS: {
    READ: "api_logs.read",
  },
  ROLES: {
    READ: "roles.read",
    MANAGE: "roles.manage",
    ASSIGN: "roles.assign",
  },
} as const;

type NestedValues<T> = T extends string
  ? T
  : { [K in keyof T]: NestedValues<T[K]> }[keyof T];

export type PermissionCode = NestedValues<typeof PERMISSION_CODES>;

/**
 * Seeded system platform roles (as documented in the Admin RBAC integration
 * guide). These can't be edited or deleted. Used for grouping + labelling in
 * the role picker and admin list.
 */
export const PLATFORM_SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Full platform access · break-glass tier",
  },
  RISK_ANALYST: {
    name: "RISK_ANALYST",
    label: "Risk Analyst",
    description: "Portfolio risk oversight",
  },
  MODEL_OPS_ENGINEER: {
    name: "MODEL_OPS_ENGINEER",
    label: "Model Ops Engineer",
    description: "Data science & model operations",
  },
  COMPLIANCE_OFFICER: {
    name: "COMPLIANCE_OFFICER",
    label: "Compliance Officer",
    description: "Audit & compliance reviews",
  },
  INFRASTRUCTURE_ENGINEER: {
    name: "INFRASTRUCTURE_ENGINEER",
    label: "Infrastructure Engineer",
    description: "SRE & platform infrastructure",
  },
} as const;

/**
 * Format any RBAC role name for display.
 *
 *   1. Known seeded system roles (SUPER_ADMIN, RISK_ANALYST, …) → friendly label
 *      from PLATFORM_SYSTEM_ROLES ("Super Admin", "Risk Analyst").
 *   2. Other snake_case / UPPER_CASE strings → replace underscores with spaces
 *      and title-case each word ("CREDIT_ANALYST" → "Credit Analyst").
 *   3. Names that already look human ("Credit analyst", "admin") → returned
 *      unchanged.
 */
export function prettyPlatformRoleName(name?: string | null): string {
  if (!name) return "—";
  const match = Object.values(PLATFORM_SYSTEM_ROLES).find(
    (r) => r.name === name,
  );
  if (match) return match.label;

  const hasUnderscore = name.includes("_");
  const isAllUpper = name === name.toUpperCase();
  if (!hasUnderscore && !isAllUpper) return name;

  return name
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ROLE_LABELS_ENUM = {
  ADMIN: {
    value: "admin",
    label: "Admin",
    description: "Full access to all resources",
  },
  CREDIT_OFFICER: {
    value: "credit_officer",
    label: "Credit Officer",
    description: "Can view and create score requests",
  },
  DEVELOPER: {
    value: "developer",
    label: "Developer",
    description: "API key and webhook management",
  },
  VIEWER: {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to reports",
  },
};
