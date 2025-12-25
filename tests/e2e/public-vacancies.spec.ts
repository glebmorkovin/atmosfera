import { expect, test } from "@playwright/test";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS"
};

const fulfillJson = (route: any, status: number, body: unknown) =>
  route.fulfill({
    status,
    headers: corsHeaders,
    contentType: "application/json",
    body: JSON.stringify(body)
  });

test("public vacancies pages load", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, "");

    if (path === "/vacancies" && request.method() === "GET") {
      return fulfillJson(route, 200, [
        {
          id: "vac-1",
          title: "Test Vacancy",
          type: "TRYOUT",
          positions: ["C"],
          ageFrom: 14,
          ageTo: 16,
          locationCity: "Test City",
          locationCountry: "Test Country",
          publishedAt: "2025-01-01T00:00:00.000Z",
          clubUser: { firstName: "Club", lastName: "One" }
        }
      ]);
    }
    if (path === "/vacancies/vac-1" && request.method() === "GET") {
      return fulfillJson(route, 200, {
        id: "vac-1",
        title: "Test Vacancy",
        type: "TRYOUT",
        positions: ["C"],
        ageFrom: 14,
        ageTo: 16,
        locationCity: "Test City",
        locationCountry: "Test Country",
        description: "Test description",
        requirements: null,
        conditions: null,
        publishedAt: "2025-01-01T00:00:00.000Z",
        contactMode: "EMAIL",
        clubUser: { firstName: "Club", lastName: "One" }
      });
    }

    return fulfillJson(route, 404, { message: "not found" });
  });

  await page.goto("/vacancies");
  const vacancyLink = page.locator('a[href="/vacancies/vac-1"]');
  await expect(vacancyLink).toBeVisible();
  await vacancyLink.click();
  await expect(page).toHaveURL(/\/vacancies\/vac-1/);
  await expect(page.locator("h1")).toBeVisible();
});
