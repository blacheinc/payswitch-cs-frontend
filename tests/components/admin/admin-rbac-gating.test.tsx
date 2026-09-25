import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../setup/render";

// Mock the auth context. We swap permission sets per case so we can assert
// what each role/persona sees.
const authState: {
  user: { id: string; permissions?: string[] } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
} = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  logout: vi.fn(async () => {}),
};

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => authState,
}));

// Theme and auth-service mocks — neither is the unit under test, but the
// admin layout pulls them in.
vi.mock("@/contexts/theme-context", () => ({
  useTheme: () => ({ resolvedTheme: "light", toggleTheme: vi.fn() }),
}));
vi.mock("@/lib/auth-service", () => ({
  authService: {
    getMe: vi.fn(async () => ({ name: "Test", email: "test@example.com" })),
  },
}));

// next/navigation hooks — the layout uses usePathname.
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin-dashboard",
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
}));

import { AdminShell } from "@/components/layout/admin-shell";
import OrganizationsPage from "@/app/(admin)/organizations/page";
import TrainingPage from "@/app/(admin)/training/page";
import ScoreRequestsPage from "@/app/(admin)/admin-score-requests/page";
import ScoringEnginePage from "@/app/(admin)/scoring-engine/page";
import { PERMISSION_CODES } from "@/lib/constant";

beforeEach(() => {
  authState.user = null;
  authState.isAuthenticated = false;
  authState.isLoading = false;
});

let currentPerms: string[] = [];

function setPerms(perms: string[]) {
  currentPerms = perms;
  authState.user = { id: "u-1" };
  authState.isAuthenticated = true;
}

/** Renders with the permission set a server layout would have supplied. */
function renderGated(ui: Parameters<typeof renderWithProviders>[0]) {
  return renderWithProviders(ui, { permissions: currentPerms });
}

describe("Admin sidebar nav (permission-gated)", () => {
  it("hides nav items the user lacks permission for (RISK_ANALYST persona)", () => {
    // RISK_ANALYST: monitoring.risk + monitoring.alerts + models.read +
    // rules.evaluate + admin.organizations.read.
    setPerms([
      PERMISSION_CODES.MONITORING.RISK,
      PERMISSION_CODES.MONITORING.ALERTS,
      PERMISSION_CODES.MODELS.READ,
      PERMISSION_CODES.RULES.EVALUATE,
      PERMISSION_CODES.ADMIN.ORGS_READ,
    ]);

    renderGated(
      <AdminShell>
        <div>content</div>
      </AdminShell>,
    );

    // Visible — has read perms or matches an any-of bucket
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Organizations").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Scoring Engine").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Monitoring").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);

    // Hidden — RISK_ANALYST has none of these read perms
    expect(screen.queryByText("Score Requests")).toBeNull();
    expect(screen.queryByText("Training")).toBeNull();
    expect(screen.queryByText("Access Control")).toBeNull();
  });

  it("shows every nav item for super admins (`*`)", () => {
    setPerms(["*"]);

    renderGated(
      <AdminShell>
        <div>content</div>
      </AdminShell>,
    );

    [
      "Dashboard",
      "Organizations",
      "Score Requests",
      "Training",
      "Scoring Engine",
      "Monitoring",
      "Access Control",
      "Settings",
    ].forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });
});

describe("Organizations page guard", () => {
  it("renders the NoPermission placeholder when admin.organizations.read is missing", () => {
    setPerms([]);

    renderGated(<OrganizationsPage />);

    expect(
      screen.getByText("You don't have permission to view this."),
    ).toBeTruthy();
    expect(screen.queryByText("Add Organization")).toBeNull();
  });

  it("hides the Add Organization button without admin.organizations.create", () => {
    setPerms([PERMISSION_CODES.ADMIN.ORGS_READ]);

    renderGated(<OrganizationsPage />);

    expect(screen.getByText("All Organizations")).toBeTruthy();
    expect(screen.queryByText("Add Organization")).toBeNull();
  });

  it("shows Add Organization when admin.organizations.create is granted", () => {
    setPerms([
      PERMISSION_CODES.ADMIN.ORGS_READ,
      PERMISSION_CODES.ADMIN.ORGS_CREATE,
    ]);

    renderGated(<OrganizationsPage />);

    expect(screen.getByText("Add Organization")).toBeTruthy();
  });
});

describe("Training page guard", () => {
  it("renders NoPermission when neither training_data.read nor sources.read is granted", () => {
    setPerms([]);

    renderGated(<TrainingPage />);

    expect(
      screen.getByText("You don't have permission to view this."),
    ).toBeTruthy();
  });

  it("hides Upload button without training_data.upload", () => {
    setPerms([PERMISSION_CODES.ADMIN.TRAINING_READ]);

    renderGated(<TrainingPage />);

    expect(screen.queryByText("Upload Dataset")).toBeNull();
  });

  it("shows Upload button when training_data.upload is granted", () => {
    setPerms([
      PERMISSION_CODES.ADMIN.TRAINING_READ,
      PERMISSION_CODES.ADMIN.TRAINING_UPLOAD,
    ]);

    renderGated(<TrainingPage />);

    expect(screen.getByText("Upload Dataset")).toBeTruthy();
  });
});

describe("Score Requests page guard", () => {
  it("renders NoPermission without admin.score_requests.read", () => {
    setPerms([]);
    renderGated(<ScoreRequestsPage />);
    expect(
      screen.getByText("You don't have permission to view this."),
    ).toBeTruthy();
  });

  it("renders the page when admin.score_requests.read is granted", () => {
    setPerms([PERMISSION_CODES.ADMIN.SCORE_REQUESTS_READ]);
    renderGated(<ScoreRequestsPage />);
    // Two `Score Requests` strings render — we just need the page header.
    expect(
      screen.getAllByText("Score Requests").length,
    ).toBeGreaterThan(0);
  });
});

describe("Scoring Engine page guard", () => {
  it("renders NoPermission when neither models.read nor rules.evaluate is granted", () => {
    setPerms([]);
    renderGated(<ScoringEnginePage />);
    expect(
      screen.getByText("You don't have permission to view this."),
    ).toBeTruthy();
  });

  it("hides the Models tab without models.read but shows Rules Sandbox with rules.evaluate", () => {
    setPerms([PERMISSION_CODES.RULES.EVALUATE]);

    renderGated(<ScoringEnginePage />);

    expect(screen.queryByText("Models")).toBeNull();
    expect(screen.getByText("Rules Sandbox")).toBeTruthy();
  });
});
