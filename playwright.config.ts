import { defineConfig, devices } from "@playwright/test";

// Environment variables are loaded by npm scripts using dotenv-cli -e .env.testing
// before Playwright tests run

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["**/*.spec.ts"],
  testIgnore: ["**/pages/**"],
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/e2e/report" }]],
  use: {
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    baseURL: "http://localhost:4173",
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // Setup project for authentication and cleanup
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // Tests that don't require authentication
    {
      name: "unauthenticated",
      testMatch: [/home\.spec\.ts/, /basic-ui\.spec\.ts/, /auth-diagnostic\.spec\.ts/],
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
    // Tests that require authentication
    {
      name: "authenticated",
      testIgnore: [/home\.spec\.ts/, /basic-ui\.spec\.ts/, /auth-diagnostic\.spec\.ts/, /auth\.setup\.ts/, /auth\.teardown\.ts/],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        storageState: "tests/e2e/auth/auth-session.json",
      },
    },
    // Teardown project for cleanup
    {
      name: "teardown",
      testMatch: /auth\.teardown\.ts/,
      dependencies: ["authenticated"],
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        storageState: "tests/e2e/auth/auth-session.json",
      },
    },
  ],
  outputDir: "tests/e2e/results",
  // webServer: {
  //   command: "npm run dev:e2e",
  //   port: 4173,
  //   reuseExistingServer: !process.env.CI,
  // },
});
