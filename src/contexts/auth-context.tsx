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
import apiClient, {
  setAuthToken,
  setRefreshToken,
  removeAuthToken,
  getAuthToken,
} from "@/lib/api-client";
import { User, Organization, AdminUser, OrgUser } from "@/types/models";
import { INACTIVITY_TIMEOUT_MS } from "@/lib/constant";

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
  login: (email: string, password: string) => Promise<{ requires2FA: boolean }>;
  verify2FA: (code: string) => Promise<void>;
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

  // Initialize auth state from token
  const initializeAuth = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const response = await apiClient.get<{ user: User }>("/auth/me");
      const user = response.data.user;

      setState({
        user,
        organization: getOrganization(user),
        isAuthenticated: true,
        isLoading: false,
        isAdmin: checkIsAdmin(user),
        requires2FA: false,
        pendingEmail: null,
      });
    } catch {
      // Token invalid - clear it
      removeAuthToken();
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Login function
  const login = async (
    email: string,
    password: string,
  ): Promise<{ requires2FA: boolean }> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await apiClient.post<{
        requires2FA?: boolean;
        token?: string;
        refreshToken?: string;
        user?: User;
      }>("/auth/login", { email, password });

      if (response.data.requires2FA) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          requires2FA: true,
          pendingEmail: email,
        }));
        return { requires2FA: true };
      }

      // Login successful
      const { token, refreshToken, user } = response.data;

      if (token && refreshToken && user) {
        setAuthToken(token);
        setRefreshToken(refreshToken);

        setState({
          user,
          organization: getOrganization(user),
          isAuthenticated: true,
          isLoading: false,
          isAdmin: checkIsAdmin(user),
          requires2FA: false,
          pendingEmail: null,
        });
      }

      return { requires2FA: false };
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Verify 2FA code
  const verify2FA = async (code: string): Promise<void> => {
    if (!state.pendingEmail) {
      throw new Error("No pending authentication");
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await apiClient.post<{
        token: string;
        refreshToken: string;
        user: User;
      }>("/auth/verify-2fa", {
        email: state.pendingEmail,
        code,
      });

      const { token, refreshToken, user } = response.data;

      setAuthToken(token);
      setRefreshToken(refreshToken);

      setState({
        user,
        organization: getOrganization(user),
        isAuthenticated: true,
        isLoading: false,
        isAdmin: checkIsAdmin(user),
        requires2FA: false,
        pendingEmail: null,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Logout function
  const logout = useCallback(() => {
    removeAuthToken();
    // Clear auth cookie (used by mock auth and middleware)
    if (typeof document !== "undefined") {
      document.cookie = "auth-token=; path=/; max-age=0; SameSite=Strict";
    }
    setState({
      ...initialState,
      isLoading: false,
    });

    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
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
    // Check both context state and cookie for mock-auth compatibility
    const hasAuthCookie =
      typeof document !== "undefined" &&
      document.cookie
        .split(";")
        .some((c) => c.trim().startsWith("auth-token="));
    const isLoggedIn = state.isAuthenticated || hasAuthCookie;

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
    login,
    verify2FA,
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

// Hook to require authentication
export function useRequireAuth(redirectTo: string = "/login") {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo]);

  return auth;
}

// Hook to require admin access
export function useRequireAdmin(redirectTo: string = "/dashboard") {
  const auth = useRequireAuth();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !auth.isAdmin) {
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isAdmin, redirectTo]);

  return auth;
}
