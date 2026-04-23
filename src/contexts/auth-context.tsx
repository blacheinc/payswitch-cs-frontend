"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import {
  saveSession,
  getSession,
  clearSession,
} from "@/lib/session-storage";
import { authService, mergeUserFromMeProfile } from "@/lib/auth-service";
import { User, Organization, AdminUser, OrgUser } from "@/types/models";
import { INACTIVITY_TIMEOUT_MS, ROUTES } from "@/lib/constant";

// Auth state interface
interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  requires2FA: boolean;
  pendingEmail: string | null;
}

// Auth context interface
interface AuthContextType extends AuthState {
  setSession: (
    accessToken: string,
    refreshToken: string,
    userType: string,
    user: User,
  ) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
  setMockAuthenticated: (isAdmin?: boolean) => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  requires2FA: false,
  pendingEmail: null,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  // Check if user is admin
  const checkIsAdmin = (user: User): user is AdminUser => {
    return "isAdmin" in user && user.isAdmin === true;
  };

  // Get organization from user
  const getOrganization = (user: User): Organization | null => {
    if (checkIsAdmin(user)) {
      return null;
    }
    return (user as OrgUser).organization || null;
  };

  // Initialize auth state from stored session
  const initializeAuth = useCallback(async () => {
    const session = getSession();

    if (!session) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // Hydrate from stored session immediately
    setState({
      user: session.user,
      organization: getOrganization(session.user),
      isAuthenticated: true,
      isLoading: false,
      isAdmin: checkIsAdmin(session.user),
      requires2FA: false,
      pendingEmail: null,
    });

    // Refresh profile + resolved RBAC `permissions` from GET /auth/me
    try {
      const profile = await authService.getMe();
      const merged = mergeUserFromMeProfile(
        session.user,
        profile,
        session.userType,
      );
      saveSession({ ...session, user: merged });
      setState({
        user: merged,
        organization: getOrganization(merged),
        isAuthenticated: true,
        isLoading: false,
        isAdmin: checkIsAdmin(merged),
        requires2FA: false,
        pendingEmail: null,
      });
    } catch {
      // Avoid indefinite loading in usePermissions when /auth/me fails
      if (session.user.permissions === undefined) {
        const patched = { ...session.user, permissions: [] as string[] };
        saveSession({ ...session, user: patched });
        setState({
          user: patched,
          organization: getOrganization(patched),
          isAuthenticated: true,
          isLoading: false,
          isAdmin: checkIsAdmin(patched),
          requires2FA: false,
          pendingEmail: null,
        });
      }
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Set session from mutation
  const setSession = useCallback(
    (
      accessToken: string,
      refreshToken: string,
      userType: string,
      user: User,
    ) => {
      // Persist complete session data (localStorage + cookie)
      saveSession({ accessToken, refreshToken, userType, user });

      setState({
        user,
        organization: getOrganization(user),
        isAuthenticated: true,
        isLoading: false,
        isAdmin: checkIsAdmin(user),
        requires2FA: false,
        pendingEmail: null,
      });
    },
    [],
  );

  // Logout function — sends the user back to the login page for their scope
  // so an admin doesn't land on the org portal (and vice versa).
  const logout = useCallback(() => {
    // Snapshot scope before we wipe the session.
    const wasAdmin = getSession()?.userType === "admin";
    clearSession();
    setState({
      ...initialState,
      isLoading: false,
    });

    if (typeof window !== "undefined") {
      window.location.href = wasAdmin
        ? ROUTES.AUTH.ADMIN_LOGIN
        : ROUTES.AUTH.LOGIN;
    }
  }, []);

  // Set mock authenticated state (for mock auth flow)
  const setMockAuthenticated = useCallback((isAdmin: boolean = false) => {
    const mockUser: User = isAdmin
      ? ({
          id: "mock-admin",
          email: "admin@payswitch.com",
          name: "Admin User",
          isAdmin: true,
          adminRole: "super_admin",
          roleLabel: "Super Admin",
          status: "active",
          createdAt: new Date().toISOString(),
        } as unknown as AdminUser)
      : ({
          id: "mock-user",
          email: "user@org.com",
          name: "Org User",
          roleLabel: "User",
          status: "active",
          createdAt: new Date().toISOString(),
          organizationId: "mock-org",
          organization: {
            id: "mock-org",
            name: "Mock Organization",
            slug: "mock-org",
          },
        } as unknown as OrgUser);

    setState({
      user: mockUser,
      organization: isAdmin ? null : (mockUser as OrgUser).organization || null,
      isAuthenticated: true,
      isLoading: false,
      isAdmin,
      requires2FA: false,
      pendingEmail: null,
    });
  }, []);

  // Inactivity auto-logout timer
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check both context state and stored session for mock-auth compatibility
    const hasSession = typeof window !== "undefined" && getSession() !== null;
    const isLoggedIn = state.isAuthenticated || hasSession;

    if (!isLoggedIn) return;

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];
    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer),
    );

    // Start the timer immediately
    resetTimer();

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer),
      );
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [state.isAuthenticated, logout]);

  // Refresh session
  const refreshSession = async (): Promise<void> => {
    await initializeAuth();
  };

  // Context value
  const value: AuthContextType = {
    ...state,
    setSession,
    logout,
    refreshSession,
    setMockAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// Hook to require authentication — defaults to the org login. Admin layouts
// should pass ROUTES.AUTH.ADMIN_LOGIN explicitly.
export function useRequireAuth(redirectTo: string = ROUTES.AUTH.LOGIN) {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo]);

  return auth;
}

// Hook to require admin access. Unauthed → admin login. Authed-but-non-admin
// → their own dashboard, never the admin UI.
export function useRequireAdmin(redirectTo: string = ROUTES.ORG.DASHBOARD) {
  const auth = useRequireAuth(ROUTES.AUTH.ADMIN_LOGIN);

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !auth.isAdmin) {
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isAdmin, redirectTo]);

  return auth;
}
