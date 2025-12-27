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

test("club search opens profile", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, "");

    if (path === "/auth/login" && request.method() === "POST") {
      return fulfillJson(route, 200, {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: { role: "CLUB" }
      });
    }
    if (path === "/users/me" && request.method() === "GET") {
      return fulfillJson(route, 200, { role: "CLUB" });
    }
    if (path === "/players/search" && request.method() === "GET") {
      return fulfillJson(route, 200, {
        data: [
          {
            id: "player-1",
            firstName: "Test",
            lastName: "Player",
            position: "C",
            currentClub: { name: "Test Club" },
            currentLeague: { name: "Test League" },
            media: [],
            statLines: []
          }
        ],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 }
      });
    }
    if (path === "/players/player-1" && request.method() === "GET") {
      return fulfillJson(route, 200, {
        id: "player-1",
        firstName: "Test",
        lastName: "Player",
        position: "C",
        dateOfBirth: "2005-01-01",
        currentClub: { name: "Test Club" },
        currentLeague: { name: "Test League" },
        media: [],
        statLines: [],
        achievements: [],
        clubHistory: [],
        bioText: null,
        agentCard: null
      });
    }
    if (path === "/players/player-1/view" && request.method() === "POST") {
      return fulfillJson(route, 200, { message: "ok" });
    }
    if (path === "/search-filters" && request.method() === "GET") {
      return fulfillJson(route, 200, []);
    }
    if (path === "/refs/leagues" && request.method() === "GET") {
      return fulfillJson(route, 200, []);
    }
    if (path === "/refs/clubs" && request.method() === "GET") {
      return fulfillJson(route, 200, []);
    }
    if (path === "/shortlists" && request.method() === "GET") {
      return fulfillJson(route, 200, []);
    }
    if (path === "/notes" && request.method() === "GET") {
      return fulfillJson(route, 200, []);
    }

    return fulfillJson(route, 404, { message: "not found" });
  });

  await page.goto("/auth/login");
  await page.fill('input[type="email"]', "club@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app\/club\/dashboard/);

  await page.goto("/app/club/search");
  const profileLink = page.locator('a[href="/app/club/players/player-1"]');
  await expect(profileLink).toBeVisible();
  await profileLink.click();
  await expect(page).toHaveURL(/\/app\/club\/players\/player-1/);
  await expect(page.locator("h1")).toBeVisible();
});
