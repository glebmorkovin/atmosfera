const trimSlash = (value) => value.replace(/\/+$/, "");

const webBase = trimSlash(process.env.SMOKE_WEB_BASE || "https://atmosfera-web.vercel.app");
const apiBaseInput = trimSlash(process.env.SMOKE_API_BASE || "https://atmosfera-api.onrender.com/api");
const apiBase = apiBaseInput.endsWith("/api") ? apiBaseInput : `${apiBaseInput}/api`;
const scoutEmail = process.env.SMOKE_SCOUT_EMAIL || process.env.SMOKE_EMAIL || "scout@example.com";
const scoutPassword = process.env.SMOKE_SCOUT_PASSWORD || process.env.SMOKE_PASSWORD || "password123";
const playerEmail = process.env.SMOKE_PLAYER_EMAIL || "player@example.com";
const playerPassword = process.env.SMOKE_PLAYER_PASSWORD || "password123";
const parentEmail = process.env.SMOKE_PARENT_EMAIL || "parent@example.com";
const parentPassword = process.env.SMOKE_PARENT_PASSWORD || "password123";
const clubEmail = process.env.SMOKE_CLUB_EMAIL || "club@example.com";
const clubPassword = process.env.SMOKE_CLUB_PASSWORD || "password123";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || "password123";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 30000);
const retries = Number(process.env.SMOKE_RETRIES || 2);
const requireParent = process.env.SMOKE_PARENT_REQUIRED === "true";

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

const runStep = async (label, fn, options = {}) => {
  const attempts = options.attempts ?? retries;
  const delayMs = options.delayMs ?? 1000;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      logStart(`${label} (attempt ${attempt}/${attempts})`);
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error(`${label} failed: ${lastError?.message || "unknown error"}`);
};

const getJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return response.json().catch(() => null);
};

const login = async (label, email, password) => {
  const loginResponse = await runStep(`POST /auth/login (${label})`, () =>
    fetchWithTimeout(makeUrl(apiBase, "/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
  );
  await assertStatus(loginResponse, [200, 201], `POST /auth/login (${label})`);
  logStep(`POST /auth/login (${label})`, loginResponse.status);
  const loginJson = await loginResponse.json();
  if (!loginJson?.accessToken) {
    throw new Error(`POST /auth/login (${label}) -> missing accessToken`);
  }
  return {
    accessToken: loginJson.accessToken,
    refreshToken: loginJson.refreshToken
  };
};

const loginOptional = async (label, email, password) => {
  try {
    return await login(label, email, password);
  } catch (error) {
    console.log(`[prod-smoke] ${label} login skipped: ${error.message}`);
    if (requireParent) {
      throw error;
    }
    return null;
  }
};

const createVacancy = async (label, clubToken, title, deadline) => {
  const createVacancyResponse = await runStep(`POST /club/vacancies (${label})`, () =>
    fetchWithTimeout(makeUrl(apiBase, "/club/vacancies"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${clubToken}` },
      body: JSON.stringify({
        title,
        type: "VIEWING",
        positions: ["C"],
        ageFrom: 14,
        ageTo: 16,
        locationCountry: "Россия",
        locationCity: "Москва",
        description: "Smoke: тестовая вакансия для проверки прод цепочек.",
        requirements: "Smoke: базовые требования.",
        conditions: "Smoke: тестовые условия.",
        contactMode: "platform_only",
        applicationDeadline: deadline
      })
    })
  );
  await assertStatus(createVacancyResponse, [200, 201], "POST /club/vacancies");
  const createdVacancy = await createVacancyResponse.json();
  const vacancyId = createdVacancy?.id;
  if (!vacancyId) {
    throw new Error("vacancy id missing");
  }
  console.log(`[prod-smoke] vacancy created (${label}): ${vacancyId}`);
  return vacancyId;
};

const ensureAuditEntry = async (label, adminToken, predicate) =>
  runStep(
    label,
    async () => {
      const auditResponse = await fetchWithTimeout(makeUrl(apiBase, "/admin/audit"), {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      await assertStatus(auditResponse, 200, label);
      const audit = (await getJson(auditResponse)) || [];
      if (!audit.find(predicate)) {
        throw new Error("audit entry not found");
      }
      return audit;
    },
    { attempts: Math.max(retries, 5), delayMs: 1500 }
  );

const logHeaders = (label, response) => {
  const keys = [
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
    "content-security-policy"
  ];
  keys.forEach((key) => {
    const value = response.headers.get(key);
    console.log(`[prod-smoke] ${label} header ${key}: ${value || "missing"}`);
  });
};

const main = async () => {
  const healthResponse = await runStep("GET /health", () => fetchWithTimeout(makeUrl(apiBase, "/health")));
  await assertStatus(healthResponse, 200, "GET /health");
  logStep("GET /health", healthResponse.status);

  const webResponse = await runStep("GET /", () => fetchWithTimeout(webBase));
  await assertStatus(webResponse, 200, "GET /");
  logStep("GET /", webResponse.status);
  logHeaders("GET /", webResponse);

  const scoutAuth = await login("scout", scoutEmail, scoutPassword);
  const scoutToken = scoutAuth.accessToken;

  const usersMeResponse = await runStep("GET /users/me", () =>
    fetchWithTimeout(makeUrl(apiBase, "/users/me"), {
      headers: { Authorization: `Bearer ${scoutToken}` }
    })
  );
  await assertStatus(usersMeResponse, 200, "GET /users/me");
  logStep("GET /users/me", usersMeResponse.status);

  const searchResponse = await runStep("GET /players/search?pageSize=1", () =>
    fetchWithTimeout(makeUrl(apiBase, "/players/search?pageSize=1"), {
      headers: { Authorization: `Bearer ${scoutToken}` }
    })
  );
  await assertStatus(searchResponse, 200, "GET /players/search?pageSize=1");
  logStep("GET /players/search?pageSize=1", searchResponse.status);
  const searchJson = await getJson(searchResponse);
  const searchPlayerId = searchJson?.data?.[0]?.id;
  if (!searchPlayerId) {
    throw new Error("GET /players/search -> empty list");
  }

  const profileResponse = await runStep("GET /players/:id (scout)", () =>
    fetchWithTimeout(makeUrl(apiBase, `/players/${searchPlayerId}`), {
      headers: { Authorization: `Bearer ${scoutToken}` }
    })
  );
  await assertStatus(profileResponse, 200, "GET /players/:id (scout)");
  logStep("GET /players/:id (scout)", profileResponse.status);

  const demoResponse = await runStep("GET /demo", () => fetchWithTimeout(makeUrl(webBase, "/demo")));
  await assertStatus(demoResponse, 404, "GET /demo");
  logStep("GET /demo", demoResponse.status);
  logHeaders("GET /demo", demoResponse);

  const demoDashResponse = await runStep("GET /demo/dashboard", () =>
    fetchWithTimeout(makeUrl(webBase, "/demo/dashboard"))
  );
  await assertStatus(demoDashResponse, 404, "GET /demo/dashboard");
  logStep("GET /demo/dashboard", demoDashResponse.status);

  console.log("[prod-smoke] Chain A: engagement -> working card");
  const playerAuth = await login("player", playerEmail, playerPassword);
  const playerToken = playerAuth.accessToken;
  const playerProfileResponse = await runStep("GET /players/me (player)", () =>
    fetchWithTimeout(makeUrl(apiBase, "/players/me"), {
      headers: { Authorization: `Bearer ${playerToken}` }
    })
  );
  await assertStatus(playerProfileResponse, 200, "GET /players/me (player)");
  const playerProfile = await playerProfileResponse.json();
  const playerId = playerProfile?.id;
  if (!playerId) {
    throw new Error("GET /players/me -> missing player id");
  }

  const parentAuth = await loginOptional("parent", parentEmail, parentPassword);
  let parentToken = null;
  let parentPlayerId = null;
  if (parentAuth?.accessToken) {
    parentToken = parentAuth.accessToken;
    const parentChildrenResponse = await runStep("GET /players/parent/children", () =>
      fetchWithTimeout(makeUrl(apiBase, "/players/parent/children"), {
        headers: { Authorization: `Bearer ${parentToken}` }
      })
    );
    await assertStatus(parentChildrenResponse, 200, "GET /players/parent/children");
    const children = (await getJson(parentChildrenResponse)) || [];
    parentPlayerId = children[0]?.id || null;
    if (!parentPlayerId) {
      console.log("[prod-smoke] parent has no children; fallback to player acceptance");
    }
  }

  const engagementPlayerId = parentPlayerId || playerId;
  if (searchPlayerId !== engagementPlayerId) {
    console.log(
      `[prod-smoke] search playerId (${searchPlayerId}) != engagement playerId (${engagementPlayerId}); request uses engagement player`
    );
  }

  const outboxResponse = await runStep("GET /engagement-requests/outbox (scout)", () =>
    fetchWithTimeout(makeUrl(apiBase, "/engagement-requests/outbox"), {
      headers: { Authorization: `Bearer ${scoutToken}` }
    })
  );
  await assertStatus(outboxResponse, 200, "GET /engagement-requests/outbox");
  let outbox = (await getJson(outboxResponse)) || [];
  let request =
    outbox.find((item) => item.playerId === engagementPlayerId && item.status === "PENDING") ||
    outbox.find((item) => item.playerId === engagementPlayerId && item.status === "ACCEPTED");

  if (!request) {
    const createResponse = await runStep("POST /engagement-requests", () =>
      fetchWithTimeout(makeUrl(apiBase, "/engagement-requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${scoutToken}` },
        body: JSON.stringify({ playerId: engagementPlayerId, message: "Smoke: запрос на сотрудничество" })
      })
    );
    if (createResponse.status === 409) {
      console.log("[prod-smoke] engagement request already pending (409)");
      const retryOutbox = await runStep("GET /engagement-requests/outbox (retry)", () =>
        fetchWithTimeout(makeUrl(apiBase, "/engagement-requests/outbox"), {
          headers: { Authorization: `Bearer ${scoutToken}` }
        })
      );
      await assertStatus(retryOutbox, 200, "GET /engagement-requests/outbox (retry)");
      outbox = (await getJson(retryOutbox)) || [];
      request =
        outbox.find((item) => item.playerId === engagementPlayerId && item.status === "PENDING") ||
        outbox.find((item) => item.playerId === engagementPlayerId && item.status === "ACCEPTED");
    } else {
      await assertStatus(createResponse, [200, 201], "POST /engagement-requests");
      request = await createResponse.json();
      console.log(`[prod-smoke] engagement request created: ${request.id}`);
    }
  }

  if (!request) {
    throw new Error("engagement request not found in outbox");
  }

  const verifyOutboxResponse = await runStep("GET /engagement-requests/outbox (verify)", () =>
    fetchWithTimeout(makeUrl(apiBase, "/engagement-requests/outbox"), {
      headers: { Authorization: `Bearer ${scoutToken}` }
    })
  );
  await assertStatus(verifyOutboxResponse, 200, "GET /engagement-requests/outbox (verify)");
  const verifyOutbox = (await getJson(verifyOutboxResponse)) || [];
  const outboxEntry = verifyOutbox.find((item) => item.id === request.id);
  if (!outboxEntry) {
    throw new Error("engagement request missing in outbox");
  }

  if (request.status === "PENDING") {
    const acceptAs = async (label, token) => {
      const inboxResponse = await runStep(`GET /engagement-requests/inbox (${label})`, () =>
        fetchWithTimeout(makeUrl(apiBase, "/engagement-requests/inbox"), {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      await assertStatus(inboxResponse, 200, `GET /engagement-requests/inbox (${label})`);
      const inbox = (await getJson(inboxResponse)) || [];
      const incoming = inbox.find((item) => item.id === request.id);
      if (!incoming) {
        throw new Error(`engagement request not found in ${label} inbox`);
      }
      if (incoming.status === "PENDING") {
        const acceptResponse = await runStep(`POST /engagement-requests/:id/accept (${label})`, () =>
          fetchWithTimeout(makeUrl(apiBase, `/engagement-requests/${incoming.id}/accept`), {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        await assertStatus(acceptResponse, [200, 201], `POST /engagement-requests/:id/accept (${label})`);
        logStep(`POST /engagement-requests/:id/accept (${label})`, acceptResponse.status);
      }
    };

    let accepted = false;
    if (parentToken && parentPlayerId === engagementPlayerId) {
      try {
        await acceptAs("parent", parentToken);
        accepted = true;
      } catch (error) {
        console.log(`[prod-smoke] parent accept failed, fallback to player: ${error.message}`);
      }
    }
    if (!accepted) {
      await acceptAs("player", playerToken);
    }
  }

  const workingCardsResponse = await runStep("GET /working-cards (scout)", () =>
    fetchWithTimeout(makeUrl(apiBase, "/working-cards"), {
      headers: { Authorization: `Bearer ${scoutToken}` }
    })
  );
  await assertStatus(workingCardsResponse, 200, "GET /working-cards");
  const workingCards = (await getJson(workingCardsResponse)) || [];
  const hasCard = workingCards.some((card) => card.playerId === engagementPlayerId);
  if (!hasCard) {
    throw new Error("working card not found for player");
  }
  console.log("[prod-smoke] working card confirmed");

  console.log("[prod-smoke] Chain B: vacancy -> moderation -> apply");
  const clubAuth = await login("club", clubEmail, clubPassword);
  const clubToken = clubAuth.accessToken;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
  const vacancyId = await createVacancy("approve", clubToken, `Smoke вакансия ${stamp}`, deadline);

  const submitVacancyResponse = await runStep("POST /club/vacancies/:id/submit", () =>
    fetchWithTimeout(makeUrl(apiBase, `/club/vacancies/${vacancyId}/submit`), {
      method: "POST",
      headers: { Authorization: `Bearer ${clubToken}` }
    })
  );
  await assertStatus(submitVacancyResponse, [200, 201, 409], "POST /club/vacancies/:id/submit");
  logStep("POST /club/vacancies/:id/submit", submitVacancyResponse.status);

  const adminAuth = await login("admin", adminEmail, adminPassword);
  const adminToken = adminAuth.accessToken;
  const approveResponse = await runStep("POST /admin/vacancies/:id/approve", () =>
    fetchWithTimeout(makeUrl(apiBase, `/admin/vacancies/${vacancyId}/approve`), {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` }
    })
  );
  await assertStatus(approveResponse, [200, 201, 409], "POST /admin/vacancies/:id/approve");
  logStep("POST /admin/vacancies/:id/approve", approveResponse.status);
  await ensureAuditEntry("GET /admin/audit (approve)", adminToken, (entry) => {
    return entry?.entityId === vacancyId && entry?.action === "VACANCY_APPROVED";
  });

  const rejectedVacancyId = await createVacancy("reject", clubToken, `Smoke отклонение ${stamp}`, deadline);
  const submitRejectResponse = await runStep("POST /club/vacancies/:id/submit (reject)", () =>
    fetchWithTimeout(makeUrl(apiBase, `/club/vacancies/${rejectedVacancyId}/submit`), {
      method: "POST",
      headers: { Authorization: `Bearer ${clubToken}` }
    })
  );
  await assertStatus(submitRejectResponse, [200, 201, 409], "POST /club/vacancies/:id/submit (reject)");
  logStep("POST /club/vacancies/:id/submit (reject)", submitRejectResponse.status);

  const rejectResponse = await runStep("POST /admin/vacancies/:id/reject", () =>
    fetchWithTimeout(makeUrl(apiBase, `/admin/vacancies/${rejectedVacancyId}/reject`), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: "Smoke: тестовое отклонение" })
    })
  );
  await assertStatus(rejectResponse, [200, 201, 409], "POST /admin/vacancies/:id/reject");
  logStep("POST /admin/vacancies/:id/reject", rejectResponse.status);
  await ensureAuditEntry("GET /admin/audit (reject)", adminToken, (entry) => {
    return entry?.entityId === rejectedVacancyId && entry?.action === "VACANCY_REJECTED";
  });

  const publicVacanciesResponse = await runStep("GET /vacancies (public)", () =>
    fetchWithTimeout(makeUrl(webBase, "/vacancies"))
  );
  await assertStatus(publicVacanciesResponse, 200, "GET /vacancies (public)");
  logStep("GET /vacancies (public)", publicVacanciesResponse.status);

  const publicVacancyResponse = await runStep(
    "GET /vacancies/:id (public)",
    async () => {
      const response = await fetchWithTimeout(makeUrl(webBase, `/vacancies/${vacancyId}`));
      await assertStatus(response, 200, "GET /vacancies/:id (public)");
      return response;
    },
    { attempts: Math.max(retries, 5), delayMs: 2500 }
  );
  logStep("GET /vacancies/:id (public)", publicVacancyResponse.status);

  const applyResponse = await runStep("POST /vacancies/:id/applications (player)", () =>
    fetchWithTimeout(makeUrl(apiBase, `/vacancies/${vacancyId}/applications`), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${playerToken}` },
      body: JSON.stringify({ messageFromPlayer: "Smoke: готов к просмотру." })
    })
  );
  await assertStatus(applyResponse, [200, 201, 409], "POST /vacancies/:id/applications");
  logStep("POST /vacancies/:id/applications", applyResponse.status);

  const applicationsResponse = await runStep("GET /club/vacancies/:id/applications", () =>
    fetchWithTimeout(makeUrl(apiBase, `/club/vacancies/${vacancyId}/applications`), {
      headers: { Authorization: `Bearer ${clubToken}` }
    })
  );
  await assertStatus(applicationsResponse, 200, "GET /club/vacancies/:id/applications");
  const applications = (await getJson(applicationsResponse)) || [];
  const application = applications.find((item) => item.playerId === playerId);
  if (!application) {
    throw new Error("vacancy application not found");
  }

  const updateStatusResponse = await runStep("PUT /club/applications/:id/status", () =>
    fetchWithTimeout(makeUrl(apiBase, `/club/applications/${application.id}/status`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${clubToken}` },
      body: JSON.stringify({ status: "VIEWED", messageFromClub: "Smoke: заявка просмотрена." })
    })
  );
  await assertStatus(updateStatusResponse, [200, 201], "PUT /club/applications/:id/status");
  logStep("PUT /club/applications/:id/status", updateStatusResponse.status);

  try {
    await fetchWithTimeout(makeUrl(apiBase, `/club/vacancies/${vacancyId}/archive`), {
      method: "POST",
      headers: { Authorization: `Bearer ${clubToken}` }
    });
    console.log("[prod-smoke] vacancy archived");
  } catch {
    console.log("[prod-smoke] vacancy archive skipped");
  }

  if (adminAuth.refreshToken) {
    const logoutResponse = await runStep("POST /auth/logout (admin)", () =>
      fetchWithTimeout(makeUrl(apiBase, "/auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: adminAuth.refreshToken })
      })
    );
    await assertStatus(logoutResponse, [200, 201], "POST /auth/logout (admin)");
    logStep("POST /auth/logout (admin)", logoutResponse.status);

    const refreshResponse = await runStep("POST /auth/refresh (admin after logout)", () =>
      fetchWithTimeout(makeUrl(apiBase, "/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: adminAuth.refreshToken })
      })
    );
    await assertStatus(refreshResponse, [401, 422], "POST /auth/refresh (admin after logout)");
    logStep("POST /auth/refresh (admin after logout)", refreshResponse.status);
  }

  console.log("[prod-smoke] OK");
};

main().catch((error) => {
  console.error(`[prod-smoke] FAILED: ${error.message}`);
  process.exit(1);
});
