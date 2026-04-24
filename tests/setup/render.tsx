import { ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";

/**
 * Build a QueryClient configured for tests: no retries, no stale time, so
 * mocked responses are deterministic.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export function TestProviders({ children, queryClient }: ProvidersProps) {
  const client = queryClient ?? createTestQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/**
 * Drop-in replacement for RTL's `render` that wraps in our test providers.
 * Returns the userEvent instance pre-configured (no fake timers by default).
 */
export function renderWithProviders(
  ui: ReactNode,
  options?: Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient },
) {
  const { queryClient, ...rest } = options ?? {};
  const utils = render(ui, {
    wrapper: ({ children }) => (
      <TestProviders queryClient={queryClient}>{children}</TestProviders>
    ),
    ...rest,
  });
  return { ...utils, user: userEvent.setup() };
}
