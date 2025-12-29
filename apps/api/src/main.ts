import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";
import { seedDemoUsers } from "./seed-demo";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false
    })
  );
  if (process.env.SEED_DEMO_USERS === "true") {
    try {
      const prisma = app.get(PrismaService);
      await seedDemoUsers(prisma);
      logger.log("Demo users ensured");
    } catch (err) {
      logger.error("Failed to seed demo users", err instanceof Error ? err.stack : undefined);
    }
  }
  const isProd = process.env.NODE_ENV === "production";
  const defaultOrigins = isProd
    ? "https://atmosfera-web.vercel.app"
    : "http://localhost:3000,http://127.0.0.1:3000,https://*.vercel.app";
  const corsOrigins = (process.env.CORS_ORIGINS || defaultOrigins)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const effectiveOrigins = isProd ? corsOrigins.filter((origin) => !origin.includes("*")) : corsOrigins;
  const safeOrigins = effectiveOrigins.length ? effectiveOrigins : ["https://atmosfera-web.vercel.app"];

  const isAllowedOrigin = (origin?: string) => {
    if (!origin) return true;
    return safeOrigins.some((allowed) => {
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
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
    exposedHeaders: ["x-request-id"]
  });
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.setGlobalPrefix("api");
  app.use((req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
    const incomingId = req.headers["x-request-id"];
    const requestId = typeof incomingId === "string" && incomingId ? incomingId : randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  });
  const rateLimits = new Map<string, { count: number; resetAt: number }>();
  const rateWindowMs = 60_000;
  const rateLimitMax = 10;
  const rateLimit = (req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string" && forwarded.length ? forwarded.split(",")[0].trim() : req.ip;
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const entry = rateLimits.get(key);
    if (!entry || entry.resetAt <= now) {
      rateLimits.set(key, { count: 1, resetAt: now + rateWindowMs });
      return next();
    }
    if (entry.count >= rateLimitMax) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        statusCode: 429,
        error: "Too Many Requests",
        message: "Слишком много попыток. Попробуйте позже.",
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }
    entry.count += 1;
    return next();
  };
  app.use("/api/auth/login", rateLimit);
  app.use("/api/auth/reset-request", rateLimit);
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
