// Inactivity timeout in milliseconds (5 minutes)
export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

export const TABLE_ITEM_PER_PAGE = 10;

// Routes
export const ROUTES = {
  AUTH: {
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
  },
  ADMIN: {
    DASHBOARD: "/admin-dashboard",
    ORGANIZATIONS: "/organizations",
    TRAINING: "/training",
    AI_MONITOR: "/ai-monitor",
    COMPLIANCE: "/compliance",
    // REPORTS: "/admin-reports",
    SCORE_REQUESTS: "/admin-score-requests",
    SETTINGS: "/admin-settings",
  },
  ORG: {
    DASHBOARD: "/dashboard",
    SCORE_REQUESTS: "/score-requests",
    DEVELOPERS: "/developers",
    USER_MANAGEMENT: "/user-management",
    REPORTS: "/reports",
    SETTINGS: "/settings",
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
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
    BY_ID: (id: string) => `/v1/score-requests/${id}`,
    OUTCOME: (id: string) => `/v1/score-requests/${id}/outcome`,
    PERFORMANCE: (id: string) => `/v1/score-requests/${id}/performance`,
  },
  // Bulk requests not explicitly in OpenAPI, allowing fallback or future implementation
  BULK_REQUESTS: {
    BASE: "/v1/bulk-requests",
    BY_ID: (id: string) => `/v1/bulk-requests/${id}`,
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
