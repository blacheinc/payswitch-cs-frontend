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
  saveUserCache,
  getUserCache,
  clearUserCache,
} from "@/lib/session-storage";
import { authService } from "@/lib/auth-service";
import { mergeUserFromMeProfile } from "@/lib/user-merge";
import { User, Organization, AdminUser, OrgUser } from "@/types/models";
import { INACTIVITY_TIMEOUT_MS, ROUTES } from "@/lib/constant";

// =============================================================================
// AuthContext
//
// Tokens live ONLY in the HttpOnly session cookie set by Next Route Handlers
// (`src/app/api/auth/*`). This context never sees, stores, or transmits them.
//
// What lives here:
//   - the user object (id, name, permissions, etc.) for rendering
//   - the userType ("admin" | "org") for sidebar / route gating decisions
//   - a tiny localStorage cache of the above so the UI hydrates immediately on
//     reload (the source of truth is /api/auth/me)
// =============================================================================

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  requires2FA: boolean;
  pendingEmail: string | null;
}

interface AuthContextType extends AuthState {
  /**
   * Mark the React-side state as "logged in" after a successful
   * /api/auth/login or /api/auth/2fa/verify. The HttpOnly cookie is already
   * set by the Route Handler at this point — we only sync the user shape.
   */
  setSession: (userType: string, user: User) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  requires2FA: false,
  pendingEmail: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  const checkIsAdmin = (user: User): user is AdminUser => {
    return "isAdmin" in user && user.isAdmin === true;
  };

  const getOrganization = (user: User): Organization | null => {
    if (checkIsAdmin(user)) return null;
    return (user as OrgUser).organization || null;
  };

  /**
   * Hydrate the React state.
   *
   * 1. If we have a localStorage cache of the user, render with it immediately
   *    so the UI doesn't flash a logged-out state on reload.
   * 2. Always call /api/auth/me — that's the source of truth. It returns 401
   *    if the HttpOnly cookie is missing, in which case we mark unauthenticated.
   */
  const initializeAuth = useCallback(async () => {
    const cached = getUserCache();

    if (cached) {
      setState({
        user: cached.user,
        organization: getOrganization(cached.user),
        isAuthenticated: true,
        isLoading: true,
        isAdmin: checkIsAdmin(cached.user),
        requires2FA: false,
        pendingEmail: null,
      });
    }

    try {
      const profile = await authService.getMe();
      const merged = cached
        ? mergeUserFromMeProfile(cached.user, profile, profile.user_type)
        : ({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            roleLabel: profile.role as User["roleLabel"],
            status: profile.status as User["status"],
            createdAt: profile.created_at || new Date().toISOString(),
            organizationId: profile.organization_id ?? undefined,
            permissions: profile.permissions ?? [],
            ...(profile.user_type === "admin"
              ? { isAdmin: true, adminRole: "super_admin" }
              : {}),
          } as User);

      saveUserCache({ user: merged, userType: profile.user_type ?? "org" });

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
      // /api/auth/me said 401 (no cookie / refresh failed) → unauthenticated.
      clearUserCache();
      setState({ ...initialState, isLoading: false });
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /** Called by login flows after the server has set the HttpOnly cookie. */
  const setSession = useCallback((userType: string, user: User) => {
    saveUserCache({ user, userType });
    setState({
      user,
      organization: getOrganization(user),
      isAuthenticated: true,
      isLoading: false,
      isAdmin: checkIsAdmin(user),
      requires2FA: false,
      pendingEmail: null,
    });
  }, []);

  /**
   * Logout — call /api/auth/logout to clear the HttpOnly cookie + invalidate
   * upstream, then wipe local state and bounce to the right login page.
   *
   * IMPORTANT: we await the server call before navigating. Triggering
   * `window.location.href = ...` immediately would cancel the pending fetch
   * mid-flight, leaving the HttpOnly cookie in place — the proxy middleware
   * would then see the user as "still authenticated" and bounce them back
   * to /dashboard, defeating the logout.
   */
  const logout = useCallback(async () => {
    const cached = getUserCache();
    const wasAdmin = cached?.userType === "admin";

    // Drop the local user cache up front so the UI flips immediately even if
    // the server round-trip stalls.
    clearUserCache();
    setState({ ...initialState, isLoading: false });

    try {
      await authService.logout();
    } catch {
      // Best-effort: even if the server fails, we still navigate away.
    }

    if (typeof window !== "undefined") {
      window.location.href = wasAdmin
        ? ROUTES.AUTH.ADMIN_LOGIN
        : ROUTES.AUTH.LOGIN;
    }
  }, []);

  // Inactivity auto-logout timer
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) return;

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        void logout();
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

  const refreshSession = async (): Promise<void> => {
    await initializeAuth();
  };

  const value: AuthContextType = {
    ...state,
    setSession,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useRequireAuth(redirectTo: string = ROUTES.AUTH.LOGIN) {
  const auth = useAuth();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo]);
  return auth;
}

export function useRequireAdmin(redirectTo: string = ROUTES.ORG.DASHBOARD) {
  const auth = useRequireAuth(ROUTES.AUTH.ADMIN_LOGIN);
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !auth.isAdmin) {
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isAdmin, redirectTo]);
  return auth;
}
