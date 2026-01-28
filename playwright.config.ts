import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["**/*.spec.ts"],
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/e2e/report" }]],
  use: {
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
  outputDir: "tests/e2e/results",
  webServer: {
    command: "npm run dev -- --port 4173",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
