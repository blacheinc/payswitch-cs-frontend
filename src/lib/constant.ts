// Inactivity timeout in milliseconds (5 minutes)
export const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

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
    REPORTS: "/admin-reports",
    SETTINGS: "/admin-settings",
  },
  ORG: {
    DASHBOARD: "/dashboard",
    SCORE_REQUESTS: "/score-requests",
    DEVELOPERS: "/developers",
    TEAM: "/team",
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
    VERIFY_2FA: "/auth/2fa/verify",
    SETUP_2FA: "/auth/2fa/setup",
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
    SOURCES: "/admin/sources",
    TRAINING_DATA: "/admin/training-data",
    UPLOAD_TRAINING: "/admin/training-data/upload",
  },
  ORG: {
    PROFILE: "/org/profile",
    USERS: "/org/users",
    API_KEYS: "/org/api-keys",
    WEBHOOKS: "/org/webhooks",
    LOGS: "/org/api-logs",
  },
};
