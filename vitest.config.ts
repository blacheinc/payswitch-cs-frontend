import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: [
      // `server-only` throws when bundled for the client. Vitest has no such
      // boundary, so redirect imports to a no-op stub.
      {
        find: "server-only",
        replacement: path.resolve(__dirname, "tests/setup/server-only-stub.ts"),
      },
    ],
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/**/*.{ts,tsx}",
        "src/hooks/**/*.{ts,tsx}",
        "src/contexts/**/*.{ts,tsx}",
        "src/proxy.ts",
      ],
      exclude: [
        "src/lib/openapi.json",
        "src/**/*.d.ts",
        "src/**/index.ts",
      ],
      // Thresholds are deliberately conservative — they match the current
      // baseline (services with tests sit at 80%+ individually; aggregate is
      // dragged down by services that are scaffolded but not yet covered).
      // Raise these in step with `docs/known-issues.md → service-level
      // mutation tests` as new tests land.
      thresholds: {
        lines: 35,
        branches: 25,
        functions: 20,
        statements: 35,
      },
    },
  },
});
