import { test, expect, type BrowserContext } from "@playwright/test";
import CryptoJS from "crypto-js";

/**
 * Portal-isolation + security-header E2E.
 *
 * Login UI flows (real credentials, 2FA) are covered separately against a live
 * backend — see docs/testing.md §3. The specs here seed the session cookie
 * directly so they verify the FE proxy / RBAC behaviour without depending on
 * any backend being up.
 */

const SESSION_SECRET =
  process.env.NEXT_PUBLIC_SESSION_SECRET || "e2e-test-secret";

function buildSessionCookie(userType: "admin" | "org"): string {
  const payload = JSON.stringify({
    accessToken: "test-access",
    refreshToken: "test-refresh",
    userType,
    user: {
      id: userType === "admin" ? "u-admin" : "u-org",
      email: userType === "admin" ? "admin@example.com" : "user@example.com",
      name: userType === "admin" ? "Test Admin" : "Test Org User",
      ...(userType === "admin"
        ? { isAdmin: true, adminRole: "super_admin", roleLabel: "Super Admin" }
        : {
            roleLabel: "User",
            organizationId: "org-1",
            organization: { id: "org-1", name: "Test Org", slug: "test-org" },
          }),
      permissions: ["*"],
      status: "active",
      createdAt: new Date().toISOString(),
    },
  });
  return CryptoJS.AES.encrypt(payload, SESSION_SECRET).toString();
}

async function seedSession(
  context: BrowserContext,
  userType: "admin" | "org",
  origin: string,
) {
  const ciphertext = buildSessionCookie(userType);
  const url = new URL(origin);
  await context.addCookies([
    {
      name: "session",
      value: encodeURIComponent(ciphertext),
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Strict",
    },
  ]);
}

test.describe("portal isolation (anonymous)", () => {
  test("unauthenticated /dashboard redirects to /login with ?next=", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("next=");
  });

  test("unauthenticated /admin-dashboard redirects to /admin-login with ?next=", async ({
    page,
  }) => {
    await page.goto("/admin-dashboard");
    await page.waitForURL(/\/admin-login/);
    expect(page.url()).toContain("next=");
  });
});

test.describe("portal isolation (cookie-seeded)", () => {
  test("an org user hitting /admin-dashboard sees not-found (URL preserved)", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedSession(context, "org", baseURL!);
    await page.goto("/admin-dashboard");
    expect(page.url()).toContain("/admin-dashboard");
    await expect(
      page.getByRole("heading", { name: /page not found/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("an admin hitting /dashboard sees not-found (URL preserved)", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedSession(context, "admin", baseURL!);
    await page.goto("/dashboard");
    expect(page.url()).toContain("/dashboard");
    await expect(
      page.getByRole("heading", { name: /page not found/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("logged-in org user is bounced from /login to /dashboard", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedSession(context, "org", baseURL!);
    await page.goto("/login");
    await page.waitForURL(/\/dashboard$/);
  });

  test("logged-in admin is bounced from /admin-login to /admin-dashboard", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedSession(context, "admin", baseURL!);
    await page.goto("/admin-login");
    await page.waitForURL(/\/admin-dashboard$/);
  });
});

test.describe("security headers", () => {
  test("the proxy attaches security headers on every response", async ({
    page,
  }) => {
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
