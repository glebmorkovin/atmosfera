const isRender = Boolean(
  process.env.RENDER ||
    process.env.RENDER_SERVICE_ID ||
    process.env.RENDER_GIT_COMMIT ||
    process.env.RENDER_SERVICE_NAME
);

if (!isRender) {
  process.exit(0);
}

let PrismaClient;
try {
  // Lazy-load to avoid failing installs on environments without prisma deps (e.g. Vercel web builds).
  ({ PrismaClient } = require("@prisma/client"));
} catch (err) {
  // eslint-disable-next-line no-console
  console.log(
    `[render-migrate-repair] skip: unable to load @prisma/client (${err && err.message ? err.message : "unknown error"})`
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.log("[render-migrate-repair] skip: DATABASE_URL is not set");
  process.exit(0);
}

const prisma = new PrismaClient();

async function run() {
  try {
    const failed = await prisma.$queryRaw`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL AND rolled_back_at IS NULL
    `;

    if (Array.isArray(failed) && failed.length > 0) {
      await prisma.$executeRaw`
        UPDATE "_prisma_migrations"
        SET rolled_back_at = NOW()
        WHERE finished_at IS NULL AND rolled_back_at IS NULL
      `;
      // eslint-disable-next-line no-console
      console.log(`[render-migrate-repair] marked ${failed.length} failed migrations as rolled back`);
    } else {
      // eslint-disable-next-line no-console
      console.log("[render-migrate-repair] no failed migrations detected");
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(
      `[render-migrate-repair] skip: ${err && err.message ? err.message : "unknown error"}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.log(
    `[render-migrate-repair] skip: ${err && err.message ? err.message : "unknown error"}`
  );
  process.exit(0);
});
