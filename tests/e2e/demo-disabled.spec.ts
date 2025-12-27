import { expect, test } from "@playwright/test";

test("demo disabled in production", async ({ request, baseURL }) => {
  if (!baseURL || baseURL.includes("localhost") || baseURL.includes("127.0.0.1")) {
    test.skip();
  }
  const response = await request.get("/demo");
  expect(response.status()).toBe(404);
});
