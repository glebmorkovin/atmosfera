import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const apiBaseURL = process.env.E2E_API_BASE_URL || "http://localhost:3001/api";
const useWebServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  webServer: useWebServer
    ? {
        command: "npm run dev --workspace web",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        env: {
          NEXT_PUBLIC_API_BASE_URL: apiBaseURL
        }
      }
    : undefined
});
