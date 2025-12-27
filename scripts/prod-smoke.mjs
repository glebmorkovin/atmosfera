const trimSlash = (value) => value.replace(/\/+$/, "");

const webBase = trimSlash(process.env.SMOKE_WEB_BASE || "https://atmosfera-web.vercel.app");
const apiBaseInput = trimSlash(process.env.SMOKE_API_BASE || "https://atmosfera-api.onrender.com/api");
const apiBase = apiBaseInput.endsWith("/api") ? apiBaseInput : `${apiBaseInput}/api`;
const email = process.env.SMOKE_EMAIL || "scout@example.com";
const password = process.env.SMOKE_PASSWORD || "password123";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 30000);
const retries = Number(process.env.SMOKE_RETRIES || 2);

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const makeUrl = (base, path) => `${base}${path.startsWith("/") ? path : `/${path}`}`;

const assertStatus = async (response, expectedStatus, label) => {
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  if (!expected.includes(response.status)) {
    throw new Error(`${label} -> ${response.status}`);
  }
  return response;
};

const logStart = (label) => {
  console.log(`[prod-smoke] ${label}...`);
};

const logStep = (label, status) => {
  console.log(`[prod-smoke] ${label}: ${status}`);
};

const runStep = async (label, fn) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      logStart(`${label} (attempt ${attempt}/${retries})`);
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  throw new Error(`${label} failed: ${lastError?.message || "unknown error"}`);
};

const main = async () => {
  const healthResponse = await runStep("GET /health", () => fetchWithTimeout(makeUrl(apiBase, "/health")));
  await assertStatus(healthResponse, 200, "GET /health");
  logStep("GET /health", healthResponse.status);

  const webResponse = await runStep("GET /", () => fetchWithTimeout(webBase));
  await assertStatus(webResponse, 200, "GET /");
  logStep("GET /", webResponse.status);

  const loginResponse = await runStep("POST /auth/login", () =>
    fetchWithTimeout(makeUrl(apiBase, "/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
  );
  await assertStatus(loginResponse, [200, 201], "POST /auth/login");
  logStep("POST /auth/login", loginResponse.status);

  const loginJson = await loginResponse.json();
  const accessToken = loginJson?.accessToken;
  if (!accessToken) {
    throw new Error("POST /auth/login -> missing accessToken");
  }

  const usersMeResponse = await runStep("GET /users/me", () =>
    fetchWithTimeout(makeUrl(apiBase, "/users/me"), {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
  );
  await assertStatus(usersMeResponse, 200, "GET /users/me");
  logStep("GET /users/me", usersMeResponse.status);

  const searchResponse = await runStep("GET /players/search", () =>
    fetchWithTimeout(makeUrl(apiBase, "/players/search?pageSize=1"), {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
  );
  await assertStatus(searchResponse, 200, "GET /players/search");
  logStep("GET /players/search", searchResponse.status);

  const demoResponse = await runStep("GET /demo", () => fetchWithTimeout(makeUrl(webBase, "/demo")));
  await assertStatus(demoResponse, 404, "GET /demo");
  logStep("GET /demo", demoResponse.status);

  const demoDashResponse = await runStep("GET /demo/dashboard", () =>
    fetchWithTimeout(makeUrl(webBase, "/demo/dashboard"))
  );
  await assertStatus(demoDashResponse, 404, "GET /demo/dashboard");
  logStep("GET /demo/dashboard", demoDashResponse.status);

  console.log("[prod-smoke] OK");
};

main().catch((error) => {
  console.error(`[prod-smoke] FAILED: ${error.message}`);
  process.exit(1);
});
