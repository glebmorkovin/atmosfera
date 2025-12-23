import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";
import { seedDemoUsers } from "./seed-demo";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);
  if (process.env.SEED_DEMO_USERS === "true") {
    try {
      const prisma = app.get(PrismaService);
      await seedDemoUsers(prisma);
      logger.log("Demo users ensured");
    } catch (err) {
      logger.error("Failed to seed demo users", err instanceof Error ? err.stack : undefined);
    }
  }
  const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isAllowedOrigin = (origin?: string) => {
    if (!origin) return true;
    return corsOrigins.some((allowed) => {
      if (allowed.includes("*")) {
        const regex = new RegExp(`^${allowed.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`);
        return regex.test(origin);
      }
      return allowed === origin;
    });
  };

  app.enableCors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API ready on http://localhost:${port}/api`);
}

bootstrap();
