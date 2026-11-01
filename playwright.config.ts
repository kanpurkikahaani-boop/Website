import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the admin area. Run with `npm run test:e2e` (tests/run-e2e.sh), which
 * starts a local Postgres-backed Supabase stand-in and a production build of the site.
 */
export default defineConfig({
  testDir: "tests",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
  },
});
