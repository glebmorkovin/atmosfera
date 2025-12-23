import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { UserRole } from "@prisma/client";

type CreateUserPayload = {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  country?: string;
  city?: string;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService) {}

  async demoList() {
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true }
    });
    return users;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(payload: CreateUserPayload) {
    const exists = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (exists) {
      throw new Error("EMAIL_EXISTS");
    }
    const now = new Date();
    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        passwordHash: await bcrypt.hash(payload.password, 10),
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      country: payload.country,
      city: payload.city,
      createdAt: now,
      updatedAt: now
    }
  });
    return user;
  }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive || !user.passwordHash) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      return ok ? user : null;
    } catch (err) {
      this.logger.error(`validateUser failed for ${email}`, err instanceof Error ? err.stack : undefined);
      throw err;
    }
  }

  async updatePassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) }
    });
    return user;
  }

  async createResetToken(userId: string) {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 минут
    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
    return token;
  }

  async consumeResetToken(token: string) {
    const entry = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!entry || entry.used || entry.expiresAt < new Date()) return null;
    await this.prisma.passwordResetToken.update({
      where: { token },
      data: { used: true }
    });
    return this.findById(entry.userId);
  }

  async saveRefreshToken(userId: string, token: string, ttlSeconds: number) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const jti = (() => {
      try {
        const parts = token.split(".");
        if (parts.length < 3) return randomUUID();
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        return payload.jti || randomUUID();
      } catch {
        return randomUUID();
      }
    })();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        id: jti
      }
    });
  }

  async validateRefreshToken(jti: string, token: string, userId: string) {
    const entry = await this.prisma.refreshToken.findUnique({ where: { id: jti } });
    if (!entry) return false;
    if (entry.revoked || entry.userId !== userId) return false;
    if (entry.expiresAt < new Date()) return false;
    if (entry.token !== token) return false;
    return true;
  }

  async revokeRefreshToken(jti: string) {
    await this.prisma.refreshToken.updateMany({
      where: { id: jti },
      data: { revoked: true }
    });
  }
}
