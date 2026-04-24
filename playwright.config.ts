import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration. The web server runs the Next dev build in mock-auth mode
 * so we don't need a real backend. Tests assert auth, portal isolation, and
 * permission-gated UI without depending on staging credentials.
 *
 * To target a real backend, set PLAYWRIGHT_BASE_URL and PLAYWRIGHT_USE_MOCK=false
 * before invoking `npm run test:e2e`.
 */

// Use a dedicated port so we never collide with a developer's `npm run dev`.
const PORT = process.env.PLAYWRIGHT_PORT || "3100";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;
const USE_MOCK_AUTH = process.env.PLAYWRIGHT_USE_MOCK !== "false";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // Prod build is more representative than dev mode and avoids
        // colliding with a running `next dev` (.next/dev lock).
        command: `npx next build && npx next start -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 240_000,
        env: {
          NEXT_PUBLIC_MOCK_AUTH: USE_MOCK_AUTH ? "true" : "false",
          NEXT_PUBLIC_API_URL:
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
          NEXT_PUBLIC_SESSION_SECRET:
            process.env.NEXT_PUBLIC_SESSION_SECRET || "e2e-test-secret",
        },
      },
});
