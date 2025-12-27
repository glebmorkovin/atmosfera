import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";
import { seedDemoUsers } from "./seed-demo";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

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
  const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000,https://*.vercel.app")
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
  app.use((req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
    const incomingId = req.headers["x-request-id"];
    const requestId = typeof incomingId === "string" && incomingId ? incomingId : randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API ready on http://localhost:${port}/api`);
}

bootstrap();
