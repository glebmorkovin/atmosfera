import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async health() {
    let db = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = "error";
    }
    const version = process.env.APP_VERSION || process.env.npm_package_version || "0.1.0";
    const commitSha =
      process.env.COMMIT_SHA ||
      process.env.RENDER_GIT_COMMIT ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      null;
    return {
      status: "ok",
      db,
      version,
      commitSha,
      timestamp: new Date().toISOString()
    };
  }
}
