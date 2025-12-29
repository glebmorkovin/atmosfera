import { expect, test } from "@playwright/test";

test("rbac redirects to role home", async ({ request }) => {
  const response = await request.get("/app/player/dashboard", {
    maxRedirects: 0,
    headers: { Cookie: "userRole=SCOUT" }
  });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toContain("/app/scout/dashboard");
});
