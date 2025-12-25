import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EngagementRequestStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { WorkingCardsService } from "../working-cards/working-cards.service";

@Injectable()
export class EngagementRequestsService {
  constructor(private readonly prisma: PrismaService, private readonly workingCardsService: WorkingCardsService) {}

  async createRequest(initiatorUserId: string, playerId: string, message?: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException("Player not found");

    const existing = await this.prisma.engagementRequest.findFirst({
      where: { initiatorUserId, playerId, status: EngagementRequestStatus.PENDING }
    });
    if (existing) throw new ConflictException("Запрос уже отправлен");

    return this.prisma.engagementRequest.create({
      data: {
        initiatorUserId,
        playerId,
        message: message?.trim() || null,
        status: EngagementRequestStatus.PENDING
      },
      include: {
        player: { select: { id: true, firstName: true, lastName: true, position: true } }
      }
    });
  }

  async listOutbox(initiatorUserId: string) {
    return this.prisma.engagementRequest.findMany({
      where: { initiatorUserId },
      orderBy: { createdAt: "desc" },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            currentClub: { select: { name: true } }
          }
        }
      }
    });
  }

  async listInbox(user: { id: string; role: UserRole }) {
    if (user.role === UserRole.PLAYER) {
      const player = await this.prisma.player.findUnique({ where: { userId: user.id } });
      if (!player) return [];
      return this.prisma.engagementRequest.findMany({
        where: { playerId: player.id },
        orderBy: { createdAt: "desc" },
        include: {
          initiatorUser: { select: { id: true, firstName: true, lastName: true, role: true } },
          player: { select: { id: true, firstName: true, lastName: true } }
        }
      });
    }

    if (user.role === UserRole.PARENT) {
      return this.prisma.engagementRequest.findMany({
        where: {
          player: {
            parents: {
              some: { parent: { userId: user.id } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        include: {
          initiatorUser: { select: { id: true, firstName: true, lastName: true, role: true } },
          player: { select: { id: true, firstName: true, lastName: true } }
        }
      });
    }

    return [];
  }

  async acceptRequest(id: string, user: { id: string; role: UserRole }) {
    const request = await this.prisma.engagementRequest.findUnique({
      where: { id },
      include: {
        player: { select: { id: true, userId: true } },
        initiatorUser: { select: { id: true, role: true } }
      }
    });
    if (!request) throw new NotFoundException("Запрос не найден");
    await this.ensurePlayerAccess(request.player.id, request.player.userId, user);
    if (request.status !== EngagementRequestStatus.PENDING) {
      throw new ConflictException("Запрос уже обработан");
    }
    const updated = await this.prisma.engagementRequest.update({
      where: { id },
      data: {
        status: EngagementRequestStatus.ACCEPTED,
        respondedAt: new Date()
      }
    });
    if (request.initiatorUser.role === UserRole.SCOUT || request.initiatorUser.role === UserRole.CLUB) {
      await this.workingCardsService.ensureFromEngagement(request.initiatorUser.id, request.player.id);
    }
    return updated;
  }

  async declineRequest(id: string, user: { id: string; role: UserRole }) {
    const request = await this.prisma.engagementRequest.findUnique({
      where: { id },
      include: { player: { select: { id: true, userId: true } } }
    });
    if (!request) throw new NotFoundException("Запрос не найден");
    await this.ensurePlayerAccess(request.player.id, request.player.userId, user);
    if (request.status !== EngagementRequestStatus.PENDING) {
      throw new ConflictException("Запрос уже обработан");
    }
    return this.prisma.engagementRequest.update({
      where: { id },
      data: {
        status: EngagementRequestStatus.DECLINED,
        respondedAt: new Date()
      }
    });
  }

  async cancelRequest(id: string, user: { id: string; role: UserRole }) {
    const request = await this.prisma.engagementRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException("Запрос не найден");
    if (request.initiatorUserId !== user.id) throw new ForbiddenException("Нет доступа");
    if (request.status !== EngagementRequestStatus.PENDING) {
      throw new ConflictException("Нельзя отменить обработанный запрос");
    }
    return this.prisma.engagementRequest.update({
      where: { id },
      data: {
        status: EngagementRequestStatus.CANCELLED,
        respondedAt: new Date()
      }
    });
  }

  private async ensurePlayerAccess(playerId: string, playerUserId: string, user: { id: string; role: UserRole }) {
    if (user.role === UserRole.PLAYER && playerUserId === user.id) return;
    if (user.role === UserRole.PARENT) {
      const parent = await this.prisma.parentProfile.findUnique({ where: { userId: user.id } });
      if (!parent) throw new ForbiddenException("Нет доступа");
      const link = await this.prisma.playerParent.findUnique({
        where: { playerId_parentId: { playerId, parentId: parent.id } }
      });
      if (link) return;
    }
    throw new ForbiddenException("Нет доступа");
  }
}
