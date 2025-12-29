import { expect, test } from "@playwright/test";

test("rbac redirects to role home", async ({ context, page }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL || "http://localhost:3000";
  await context.addCookies([{ name: "userRole", value: "SCOUT", url: baseURL, path: "/" }]);
  await page.addInitScript(() => {
    localStorage.setItem("userRole", "SCOUT");
    localStorage.setItem("accessToken", "access-token");
    localStorage.setItem("refreshToken", "refresh-token");
  });

  await page.goto("/app/player/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/app\/scout\/dashboard/, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/app\/scout\/dashboard/);
});
