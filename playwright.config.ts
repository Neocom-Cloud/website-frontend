import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_HOST, E2E_PORT } from "./tests/e2e/constants";

const useExistingBuild = process.env.E2E_USE_EXISTING_BUILD === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: E2E_BASE_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: useExistingBuild
      ? `pnpm exec vite preview --host ${E2E_HOST} --port ${E2E_PORT}`
      : `pnpm build && pnpm exec vite preview --host ${E2E_HOST} --port ${E2E_PORT}`,
    url: E2E_BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } }
  ]
});
