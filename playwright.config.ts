import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration. Specs seed the session cookie directly (see
 * tests/e2e/auth.spec.ts) so they exercise the FE proxy + RBAC routing
 * without depending on a real backend.
 *
 * To target a deployed environment, set PLAYWRIGHT_BASE_URL before invoking
 * `npm run test:e2e`.
 */

// Use a dedicated port so we never collide with a developer's `npm run dev`.
const PORT = process.env.PLAYWRIGHT_PORT || "3100";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;

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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // Prod build is more representative than dev mode and avoids
        // colliding with a running `next dev` (.next/dev lock).
        // We use `next start` here; Next prints an informational warning
        // about output: "standalone" that's safe to ignore for tests since
        // the regular .next/server/ output is still present.
        command: `npx next build && npx next start -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 240_000,
        env: {
          BACKEND_API_URL:
            process.env.BACKEND_API_URL || "http://localhost:3001",
        },
      },
});
