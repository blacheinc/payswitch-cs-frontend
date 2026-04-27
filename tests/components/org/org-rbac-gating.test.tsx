import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../setup/render";

const authState: {
  user: { id: string; permissions?: string[] } | null;
  organization: { name?: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
} = {
  user: null,
  organization: { name: "Acme Bank" },
  isAuthenticated: false,
  isLoading: false,
  logout: vi.fn(async () => {}),
};

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => authState,
}));
vi.mock("@/contexts/theme-context", () => ({
  useTheme: () => ({ resolvedTheme: "light", toggleTheme: vi.fn() }),
}));
vi.mock("@/lib/auth-service", () => ({
  authService: {
    getMe: vi.fn(async () => ({ name: "Test", email: "test@example.com" })),
  },
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ id: "sr-1" }),
}));

import OrgLayout from "@/app/(org)/layout";
import ScoreRequestsListPage from "@/app/(org)/score-requests/page";
import ScoreRequestDetailPage from "@/app/(org)/score-requests/[id]/page";
import NewScoreRequestPage from "@/app/(org)/score-requests/new/page";
import { OrgProfileTab } from "@/components/settings/org-profile-tab";
import { PERMISSION_CODES } from "@/lib/constant";

beforeEach(() => {
  authState.user = null;
  authState.isAuthenticated = false;
  authState.isLoading = false;
});

function setPerms(perms: string[]) {
  authState.user = { id: "u-1", permissions: perms };
  authState.isAuthenticated = true;
}

describe("Org sidebar nav (permission-gated)", () => {
  it("hides Teams when the user lacks users.list and roles.read", () => {
    setPerms([PERMISSION_CODES.SCORE_REQUESTS.LIST]);

    renderWithProviders(
      <OrgLayout>
        <div>content</div>
      </OrgLayout>,
    );

    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Score Requests").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
    expect(screen.queryByText("Teams")).toBeNull();
  });

  it("hides Score Requests when the user lacks both list perms", () => {
    setPerms([PERMISSION_CODES.USERS.LIST]);

    renderWithProviders(
      <OrgLayout>
        <div>content</div>
      </OrgLayout>,
    );

    expect(screen.queryByText("Score Requests")).toBeNull();
    expect(screen.getAllByText("Teams").length).toBeGreaterThan(0);
  });

  it("shows everything for `*` super-admin equivalents", () => {
    setPerms(["*"]);

    renderWithProviders(
      <OrgLayout>
        <div>content</div>
      </OrgLayout>,
    );

    ["Dashboard", "Score Requests", "Teams", "Settings"].forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });
});

describe("Score Requests list page guard", () => {
  it("renders NoPermission without score_requests.list", () => {
    setPerms([]);
    renderWithProviders(<ScoreRequestsListPage />);
    expect(
      screen.getByText("You don't have permission to view this."),
    ).toBeTruthy();
  });

  it("hides Bulk Request button without batch_scoring.list", () => {
    setPerms([PERMISSION_CODES.SCORE_REQUESTS.LIST]);
    renderWithProviders(<ScoreRequestsListPage />);
    expect(screen.queryByText("Bulk Request")).toBeNull();
  });

  it("hides New Request button without score_requests.create", () => {
    setPerms([PERMISSION_CODES.SCORE_REQUESTS.LIST]);
    renderWithProviders(<ScoreRequestsListPage />);
    expect(screen.queryByText("New Request")).toBeNull();
  });

  it("shows New Request when score_requests.create is granted", () => {
    setPerms([
      PERMISSION_CODES.SCORE_REQUESTS.LIST,
      PERMISSION_CODES.SCORE_REQUESTS.CREATE,
    ]);
    renderWithProviders(<ScoreRequestsListPage />);
    expect(screen.getByText("New Request")).toBeTruthy();
  });
});

describe("Score Request detail page guard", () => {
  it("renders NoPermission without score_requests.read", () => {
    setPerms([]);
    renderWithProviders(<ScoreRequestDetailPage />);
    expect(
      screen.getByText("You don't have permission to view this."),
    ).toBeTruthy();
  });
});

describe("New Score Request page guard", () => {
  it("blocks the flow when score_requests.create is missing", () => {
    setPerms([PERMISSION_CODES.BUREAU.LOOKUP]);
    renderWithProviders(<NewScoreRequestPage />);
    expect(
      screen.getByText(/score_requests\.create/),
    ).toBeTruthy();
  });

  it("blocks the flow when bureau.lookup is missing", () => {
    setPerms([PERMISSION_CODES.SCORE_REQUESTS.CREATE]);
    renderWithProviders(<NewScoreRequestPage />);
    expect(screen.getByText(/bureau\.lookup/)).toBeTruthy();
  });

  it("renders the multi-step flow when both perms are granted", () => {
    setPerms([
      PERMISSION_CODES.SCORE_REQUESTS.CREATE,
      PERMISSION_CODES.BUREAU.LOOKUP,
    ]);
    renderWithProviders(<NewScoreRequestPage />);
    // Step header is unique to the actual flow.
    expect(screen.getByText(/Step 1 of/)).toBeTruthy();
  });
});

describe("Org profile tab gating", () => {
  it("renders NoPermission inline when org.read is missing", () => {
    setPerms([]);
    renderWithProviders(<OrgProfileTab />);
    expect(
      screen.getByText("You don't have permission to view this."),
    ).toBeTruthy();
  });

  it("hides Save Changes button when org.update is missing but org.read is granted", () => {
    setPerms([PERMISSION_CODES.ORG.READ]);
    renderWithProviders(<OrgProfileTab />);
    expect(screen.queryByText("Save Changes")).toBeNull();
  });

  it("lets the data fetch run when org.read is granted (no NoPermission)", () => {
    // With org.read the gate clears and the query runs — without a mock the
    // tab sits on the loader rather than rendering the read-denied placeholder.
    // That's enough to prove the perm check let the user through.
    setPerms([PERMISSION_CODES.ORG.READ, PERMISSION_CODES.ORG.UPDATE]);
    renderWithProviders(<OrgProfileTab />);
    expect(
      screen.queryByText("You don't have permission to view this."),
    ).toBeNull();
  });
});
