import { expect, test } from "@playwright/test";

const prodBaseUrl = "https://atmosfera-web.vercel.app";

test("demo disabled in production", async ({ request, baseURL }) => {
  test.skip(baseURL !== prodBaseUrl, "Тест работает только против production домена.");
  const demoResponse = await request.get("/demo");
  expect(demoResponse.status()).toBe(404);

  const dashboardResponse = await request.get("/demo/dashboard");
  expect(dashboardResponse.status()).toBe(404);
});
