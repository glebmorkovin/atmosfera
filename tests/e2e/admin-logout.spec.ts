import { expect, test } from "@playwright/test";

const corsHeaders = (request: any) => {
  const origin = request.headers()["origin"] || "*";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type,authorization,x-request-id",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS"
  };
};

const fulfillJson = (route: any, status: number, body: unknown) =>
  route.fulfill({
    status,
    headers: corsHeaders(route.request()),
    contentType: "application/json",
    body: JSON.stringify(body)
  });

test("admin logout clears session", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: corsHeaders(request) });
    }
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, "");

    if (path === "/auth/login" && request.method() === "POST") {
      return fulfillJson(route, 200, {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: { role: "ADMIN" }
      });
    }
    if (path === "/users/me" && request.method() === "GET") {
      return fulfillJson(route, 200, { role: "ADMIN" });
    }
    if (path === "/auth/logout" && request.method() === "POST") {
      return fulfillJson(route, 200, { message: "ok" });
    }
    if (path === "/admin/users" && request.method() === "GET") {
      return fulfillJson(route, 200, []);
    }
    if (path === "/admin/media" && request.method() === "GET") {
      return fulfillJson(route, 200, []);
    }
    if (path === "/admin/leagues" && request.method() === "GET") {
      return fulfillJson(route, 200, []);
    }
    if (path === "/admin/vacancies" && request.method() === "GET") {
      return fulfillJson(route, 200, []);
    }
    if (path === "/players/search" && request.method() === "GET") {
      return fulfillJson(route, 200, { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    }

    return fulfillJson(route, 404, { message: "not found" });
  });

  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/auth/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/);

  const logoutButton = page.getByRole("button", { name: "Выйти" });
  await expect(logoutButton).toBeVisible();
  await logoutButton.click();
  await expect(page).toHaveURL(/\/auth\/login/);

  const storage = await page.evaluate(() => ({
    access: localStorage.getItem("accessToken"),
    refresh: localStorage.getItem("refreshToken"),
    role: localStorage.getItem("userRole"),
    cookie: document.cookie
  }));

  expect(storage.access).toBeNull();
  expect(storage.refresh).toBeNull();
  expect(storage.role).toBeNull();
  expect(storage.cookie.includes("userRole=")).toBeFalsy();
});
