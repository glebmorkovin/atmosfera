import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationType, Prisma } from "@prisma/client";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() }
    });
    return { message: "Отмечено прочитанным" };
  }

  async markAll(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
    return { message: "Все уведомления отмечены" };
  }

  async create(userId: string, type: NotificationType, title: string, body: string, payload?: Record<string, unknown>) {
    return this.prisma.notification.create({
      data: { userId, type, title, body, payload: (payload || {}) as Prisma.JsonValue }
    });
  }
}
