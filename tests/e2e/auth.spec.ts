import { test, expect } from "@playwright/test";

/**
 * Auth & portal-isolation smoke tests. These run against the dev server with
 * NEXT_PUBLIC_MOCK_AUTH=true (see playwright.config.ts), so we exercise the
 * full FE auth flow without depending on a real backend.
 */

test.describe("login flows", () => {
  test("an org user can sign in and reach /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("user@org.com");
    await page.locator("#password").fill("any-value");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/welcome/i);
  });

  test("an admin user can sign in and reach /admin-dashboard", async ({ page }) => {
    await page.goto("/admin-login");
    await page.locator("#email").fill("admin@payswitch.com");
    await page.locator("#password").fill("any-value");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL(/\/admin-dashboard$/);
    // Admin shell should render with at least one sidebar nav link.
    await expect(page.getByRole("link", { name: /dashboard/i }).first()).toBeVisible();
  });

  // NOTE: 2FA challenge UI requires a real backend response; mock auth only
  // toasts when the email contains "2fa". Add coverage in the live-API E2E
  // pass once a staging account with 2FA enabled is available.
});

test.describe("portal isolation", () => {
  test("unauthenticated /dashboard redirects to /login with ?next=", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("next=");
  });

  test("unauthenticated /admin-dashboard redirects to /admin-login with ?next=", async ({ page }) => {
    await page.goto("/admin-dashboard");
    await page.waitForURL(/\/admin-login/);
    expect(page.url()).toContain("next=");
  });

  test("an org user hitting /admin-dashboard sees a not-found page (URL preserved)", async ({ page }) => {
    // First, sign in as an org user.
    await page.goto("/login");
    await page.locator("#email").fill("user@org.com");
    await page.locator("#password").fill("any-value");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard$/);

    // Now attempt the wrong portal.
    await page.goto("/admin-dashboard");
    // Proxy rewrites to /_not-found WITHOUT changing the URL.
    expect(page.url()).toContain("/admin-dashboard");
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("an admin hitting /dashboard sees a not-found page (URL preserved)", async ({ page }) => {
    await page.goto("/admin-login");
    await page.locator("#email").fill("admin@payswitch.com");
    await page.locator("#password").fill("any-value");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/admin-dashboard$/);

    await page.goto("/dashboard");
    expect(page.url()).toContain("/dashboard");
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("logged-in org user is bounced from /login to /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("user@org.com");
    await page.locator("#password").fill("any-value");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard$/);

    await page.goto("/login");
    await page.waitForURL(/\/dashboard$/);
  });
});

test.describe("security headers", () => {
  test("the proxy attaches security headers on every response", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response).not.toBeNull();
    if (response) {
      const headers = response.headers();
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["strict-transport-security"]).toContain("max-age");
      expect(headers["referrer-policy"]).toContain("strict-origin");
    }
  });
});
