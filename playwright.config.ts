import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end checks for the connected demo journeys.
 * Runs against an already running server (dev or `npm run start`) at BASE_URL,
 * defaulting to http://localhost:3000.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
