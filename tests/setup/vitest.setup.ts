import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./msw-server";

// =============================================================================
// MSW lifecycle
// =============================================================================
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  // Always start each test from a clean storage state.
  if (typeof globalThis.localStorage?.clear === "function") {
    globalThis.localStorage.clear();
  }
  if (typeof globalThis.sessionStorage?.clear === "function") {
    globalThis.sessionStorage.clear();
  }
  if (typeof document !== "undefined" && document.cookie) {
    document.cookie
      .split(";")
      .forEach(
        (c) =>
          (document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)),
      );
  }
});
afterAll(() => server.close());

// =============================================================================
// Default env vars used by source code under test
// =============================================================================
vi.stubEnv("BACKEND_API_URL", "http://api.test/api");

// =============================================================================
// Polyfills happy-dom doesn't ship
// =============================================================================

// happy-dom v20 ships an empty `localStorage` stub. Replace with a real
// in-memory implementation so source code that calls `localStorage.setItem`
// etc. works as expected.
function createMemoryStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null;
    },
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
    },
    setItem(key: string, value: string): void {
      store[key] = String(value);
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
  };
}

function installStorage(name: "localStorage" | "sessionStorage") {
  const fresh = createMemoryStorage();
  if (typeof window !== "undefined") {
    Object.defineProperty(window, name, {
      configurable: true,
      writable: true,
      value: fresh,
    });
  }
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value: fresh,
  });
}

installStorage("localStorage");
installStorage("sessionStorage");

if (typeof globalThis.matchMedia !== "function") {
  Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
