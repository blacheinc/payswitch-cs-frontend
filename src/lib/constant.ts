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
