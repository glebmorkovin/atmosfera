import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const apiBaseURL = process.env.E2E_API_BASE_URL || "http://localhost:3001/api";
const useWebServer = !process.env.E2E_BASE_URL;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: isCI ? "retain-on-failure" : "on-first-retry",
    video: isCI ? "retain-on-failure" : "off",
    screenshot: isCI ? "only-on-failure" : "off"
  },
  webServer: useWebServer
    ? {
        command: "npm run dev --workspace web -- --hostname 127.0.0.1 --port 3000",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        env: {
          NEXT_PUBLIC_API_BASE_URL: apiBaseURL
        }
      }
    : undefined
});
