"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

// Default query options
const defaultQueryOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on 4xx errors
      if (error && typeof error === "object" && "statusCode" in error) {
        const statusCode = (error as { statusCode: number }).statusCode;
        if (statusCode >= 400 && statusCode < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: false,
  },
};

// Create query client
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  });
}

// Provider component
interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Query keys factory
export const queryKeys = {
  // Auth
  auth: {
    user: ["auth", "user"] as const,
    session: ["auth", "session"] as const,
  },

  // Organizations
  organizations: {
    all: ["organizations"] as const,
    list: (params?: Record<string, unknown>) =>
      ["organizations", "list", params] as const,
    detail: (id: string) => ["organizations", "detail", id] as const,
    stats: (id: string) => ["organizations", "stats", id] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    list: (orgId: string, params?: Record<string, unknown>) =>
      ["users", "list", orgId, params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },

  // API Keys
  apiKeys: {
    all: ["apiKeys"] as const,
    list: (orgId: string) => ["apiKeys", "list", orgId] as const,
  },

  // Score Requests
  scoreRequests: {
    all: ["scoreRequests"] as const,
    list: (params?: Record<string, unknown>) =>
      ["scoreRequests", "list", params] as const,
    detail: (id: string) => ["scoreRequests", "detail", id] as const,
  },

  // Dashboard
  dashboard: {
    admin: ["dashboard", "admin"] as const,
    org: (orgId: string) => ["dashboard", "org", orgId] as const,
  },

  // Models
  models: {
    all: ["models"] as const,
    list: (params?: Record<string, unknown>) =>
      ["models", "list", params] as const,
    detail: (id: string) => ["models", "detail", id] as const,
    current: ["models", "current"] as const,
  },

  // Usage
  usage: {
    stats: (orgId?: string) => ["usage", "stats", orgId] as const,
  },
};
