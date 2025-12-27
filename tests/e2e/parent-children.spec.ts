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

test("parent creates child profile", async ({ page }) => {
  const children: any[] = [];

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
        user: { role: "PARENT" }
      });
    }
    if (path === "/users/me" && request.method() === "GET") {
      return fulfillJson(route, 200, { role: "PARENT" });
    }
    if (path === "/players/parent/children" && request.method() === "GET") {
      return fulfillJson(route, 200, children);
    }
    if (path === "/players/parent/children" && request.method() === "POST") {
      const payload = request.postDataJSON() as any;
      const child = {
        id: "child-1",
        firstName: payload.firstName,
        lastName: payload.lastName,
        position: payload.position,
        dateOfBirth: payload.dateOfBirth,
        city: payload.city,
        country: payload.country
      };
      children.push(child);
      return fulfillJson(route, 200, child);
    }

    return fulfillJson(route, 404, { message: "not found" });
  });

  await page.goto("/auth/login");
  await page.fill('input[type="email"]', "parent@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app\/parent\/dashboard/);

  await page.goto("/app/parent/children");
  await page.getByRole("button", { name: "Добавить ребёнка" }).click();

  await page.getByLabel("Имя").fill("Иван");
  await page.getByLabel("Фамилия").fill("Петров");
  await page.getByLabel("Дата рождения").fill("2012-05-10");
  await page.getByLabel("Позиция").selectOption("C");
  await page.getByLabel("Страна").fill("Россия");
  await page.getByLabel("Город").fill("Москва");

  await page.getByRole("button", { name: "Создать профиль" }).click();

  await expect(page.getByText("Профиль ребёнка создан")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Иван Петров" })).toBeVisible();
});
