import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EngagementRequestStatus, MediaStatus, NotificationType, Position, UserRole } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

type ListFilters = Partial<{
  position: string;
  league: string;
  minAge: number;
  maxAge: number;
  hasVideo: boolean;
}>;

type SearchFilters = Partial<{
  position: string;
  leagueId: string;
  clubId: string;
  country: string;
  city: string;
  minBirthYear: number;
  maxBirthYear: number;
  minHeight: number;
  maxHeight: number;
  minWeight: number;
  maxWeight: number;
  hasVideo: boolean;
  minGames: number;
  minGoals: number;
  minPoints: number;
}>;

type Pagination = { page: number; pageSize: number };
type CreateParentChildPayload = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
  position?: string;
  country?: string;
  city?: string;
  nationality?: string;
  email?: string;
  password?: string;
  relationType?: string;
};

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService, private readonly notificationsService: NotificationsService) {}

  async list(filters?: ListFilters) {
    const { position, league, minAge, maxAge, hasVideo } = filters || {};
    const today = new Date();
    const minBirthDate = typeof maxAge === "number" ? new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate()) : undefined;
    const maxBirthDate = typeof minAge === "number" ? new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate()) : undefined;

    return this.prisma.player.findMany({
      where: {
        isActive: true,
        isPublicInSearch: true,
        position: position ? (position as any) : undefined,
        currentLeague: league ? { name: { equals: league, mode: "insensitive" } } : undefined,
        dateOfBirth: {
          gte: minBirthDate,
          lte: maxBirthDate
        },
        media: hasVideo
          ? {
              some: {
                mediaType: "video",
                status: MediaStatus.APPROVED
              }
            }
          : undefined
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        dateOfBirth: true,
        currentClub: { select: { name: true } },
        currentLeague: { select: { name: true } },
        heightCm: true,
        weightKg: true,
        city: true,
        country: true,
        media: {
          where: { status: MediaStatus.APPROVED, isProfileMain: true },
          take: 1,
          select: { urlOrPath: true }
        },
        statLines: {
          take: 1,
          orderBy: { season: { startYear: "desc" } },
          select: { season: { select: { name: true } }, gamesPlayed: true, goals: true, assists: true, points: true }
        }
      }
    });
  }

  async getById(id: string, user?: { id: string; role: UserRole }) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: {
        currentClub: true,
        currentLeague: true,
        agentCard: true,
        media: {
          where: { status: MediaStatus.APPROVED },
          orderBy: { createdAt: "desc" }
        },
        statLines: {
          include: { season: true, league: true, team: true },
          orderBy: { season: { startYear: "desc" } }
        },
        achievements: true,
        clubHistory: { include: { club: true, league: true, season: true }, orderBy: { season: { startYear: "desc" } } }
      }
    });
    if (!player) throw new NotFoundException("Player not found");
    if ((user?.role === UserRole.SCOUT || user?.role === UserRole.CLUB) && (!player.isPublicInSearch || !player.isActive)) {
      throw new NotFoundException("Player not found");
    }
    if (user?.role === UserRole.PLAYER && player.userId !== user.id) {
      throw new ForbiddenException("Нет доступа");
    }
    if (user?.role === UserRole.PARENT) {
      const isParent = await this.isParentOfPlayer(player.id, user.id);
      if (!isParent) throw new ForbiddenException("Нет доступа");
    }
    const agentCard = await this.sanitizeAgentCard(player.agentCard, player, user);
    return { ...player, agentCard };
  }

  async getSelf(user: { id: string; role: UserRole }) {
    const player = await this.prisma.player.findUnique({ where: { userId: user.id } });
    if (!player) throw new NotFoundException("Player not found");
    return this.getById(player.id, user);
  }

  async listParentChildren(userId: string) {
    const parent = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) return [];
    const links = await this.prisma.playerParent.findMany({
      where: { parentId: parent.id },
      include: { player: true }
    });
    return links.map((link) => ({
      id: link.player.id,
      firstName: link.player.firstName,
      lastName: link.player.lastName,
      position: link.player.position,
      dateOfBirth: link.player.dateOfBirth,
      city: link.player.city,
      country: link.player.country
    }));
  }

  async createParentChild(userId: string, payload: CreateParentChildPayload) {
    const parent = await this.ensureParentProfile(userId);
    const firstName = payload.firstName?.trim();
    const lastName = payload.lastName?.trim();
    const middleName = payload.middleName?.trim() || null;
    const country = payload.country?.trim();
    const city = payload.city?.trim();
    const nationality = payload.nationality?.trim() || country || "Не указано";

    if (!firstName) throw new BadRequestException("Имя обязательно");
    if (!lastName) throw new BadRequestException("Фамилия обязательна");
    if (!country) throw new BadRequestException("Страна обязательна");
    if (!city) throw new BadRequestException("Город обязателен");

    if (!payload.dateOfBirth) throw new BadRequestException("Дата рождения обязательна");
    const dateOfBirth = new Date(payload.dateOfBirth);
    if (Number.isNaN(dateOfBirth.getTime())) throw new BadRequestException("Некорректная дата рождения");

    const positionKey = payload.position?.toUpperCase();
    if (!positionKey || !(positionKey in Position)) {
      throw new BadRequestException("Позиция обязательна");
    }
    const position = Position[positionKey as keyof typeof Position];

    const rawEmail = payload.email?.trim().toLowerCase();
    if (rawEmail && !rawEmail.includes("@")) throw new BadRequestException("Некорректный email");
    if (payload.password && payload.password.trim().length < 8) {
      throw new BadRequestException("Пароль должен быть не короче 8 символов");
    }

    if (rawEmail) {
      const existing = await this.prisma.user.findUnique({ where: { email: rawEmail } });
      if (existing) throw new ConflictException("Email уже используется");
    }

    const email = rawEmail || `child-${randomUUID()}@atmosfera.local`;
    const password = payload.password?.trim() || randomUUID();

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(password, 10),
          role: UserRole.PLAYER,
          firstName,
          lastName,
          country,
          city
        }
      });
      const player = await tx.player.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          middleName,
          dateOfBirth,
          nationality,
          country,
          city,
          position,
          isPublicInSearch: false,
          isActive: true
        }
      });
      await tx.playerParent.create({
        data: {
          playerId: player.id,
          parentId: parent.id,
          relationType: payload.relationType?.trim() || null
        }
      });
      return player;
    });

    return {
      id: created.id,
      firstName: created.firstName,
      lastName: created.lastName,
      position: created.position,
      dateOfBirth: created.dateOfBirth,
      city: created.city,
      country: created.country
    };
  }

  async unlinkParentChild(userId: string, playerId: string) {
    const parent = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw new ForbiddenException("Нет доступа");
    const link = await this.prisma.playerParent.findUnique({
      where: { playerId_parentId: { playerId, parentId: parent.id } }
    });
    if (!link) throw new NotFoundException("Связь не найдена");
    await this.prisma.playerParent.delete({
      where: { playerId_parentId: { playerId, parentId: parent.id } }
    });
    return { message: "Профиль отвязан" };
  }

  async search(filters: SearchFilters, pagination: Pagination, user?: { id: string; role: UserRole }) {
    const {
      position,
      leagueId,
      clubId,
      country,
      city,
      minBirthYear,
      maxBirthYear,
      minHeight,
      maxHeight,
      minWeight,
      maxWeight,
      hasVideo,
      minGames,
      minGoals,
      minPoints
    } = filters;

    const enforcePublic = user?.role === UserRole.SCOUT || user?.role === UserRole.CLUB;
    const where: any = {
      isActive: true,
      isPublicInSearch: enforcePublic ? true : undefined,
      position: position ? (position as any) : undefined,
      currentLeagueId: leagueId,
      currentClubId: clubId,
      country: country ? { contains: country, mode: "insensitive" } : undefined,
      city: city ? { contains: city, mode: "insensitive" } : undefined,
      heightCm: {
        gte: minHeight,
        lte: maxHeight
      },
      weightKg: {
        gte: minWeight,
        lte: maxWeight
      },
      dateOfBirth: {
        gte: maxBirthYear ? new Date(maxBirthYear, 0, 1) : undefined,
        lte: minBirthYear ? new Date(minBirthYear, 11, 31) : undefined
      },
      media: hasVideo
        ? {
            some: { mediaType: "video", status: MediaStatus.APPROVED }
          }
        : undefined,
      statLines:
        minGames || minGoals || minPoints
          ? {
              some: {
                gamesPlayed: minGames ? { gte: minGames } : undefined,
                goals: minGoals ? { gte: minGoals } : undefined,
                points: minPoints ? { gte: minPoints } : undefined
              }
            }
          : undefined
    };
    if (user?.role === UserRole.PLAYER) {
      where.userId = user.id;
    }
    if (user?.role === UserRole.PARENT) {
      where.parents = { some: { parent: { userId: user.id } } };
    }

    const page = Math.max(1, pagination.page || 1);
    const pageSize = Math.min(Math.max(1, pagination.pageSize || 20), 100);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          dateOfBirth: true,
          heightCm: true,
          weightKg: true,
          currentClub: { select: { name: true } },
          currentLeague: { select: { name: true } },
          city: true,
          country: true,
          media: { where: { isProfileMain: true, status: MediaStatus.APPROVED }, take: 1, select: { urlOrPath: true } },
          statLines: {
            take: 1,
            orderBy: { season: { startYear: "desc" } },
            select: { season: { select: { name: true } }, gamesPlayed: true, goals: true, assists: true, points: true }
          }
        }
      }),
      this.prisma.player.count({ where })
    ]);

    return {
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async trackView(playerId: string, viewerUserId?: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player || !player.isActive || !player.isPublicInSearch) {
      throw new NotFoundException("Player not found");
    }
    await this.prisma.profileViewEvent.create({
      data: {
        playerId,
        viewerUserId
      }
    });
    if (player.userId && viewerUserId && player.userId !== viewerUserId) {
      await this.notificationsService.create(
        player.userId,
        NotificationType.PROFILE_VIEW,
        "Ваш профиль посмотрели",
        "Скаут или клуб открыл ваш профиль",
        { viewerUserId }
      );
    }
    return { message: "Просмотр зафиксирован" };
  }

  async updateProfile(playerId: string, payload: any, user: { id: string; role: UserRole }) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException("Player not found");
    const canEdit = await this.canEdit(player, user);
    if (!canEdit) throw new ForbiddenException("Нет прав на редактирование");
    const data: any = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      position: payload.position,
      country: payload.country,
      city: payload.city,
      currentClubId: payload.currentClubId,
      currentLeagueId: payload.currentLeagueId,
      heightCm: payload.heightCm,
      weightKg: payload.weightKg,
      bioText: payload.bioText,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      isPublicInSearch: payload.isPublicInSearch,
      showContactsToScoutsOnly: payload.showContactsToScoutsOnly
    };
    if (payload.agentCard) {
      const agentCard = payload.agentCard;
      await this.prisma.agentCard.upsert({
        where: { playerId },
        update: {
          cooperationUntil: agentCard.cooperationUntil ?? null,
          potentialText: agentCard.potentialText ?? null,
          skillsText: agentCard.skillsText ?? null,
          contractStatusText: agentCard.contractStatusText ?? null,
          contactsText: agentCard.contactsText ?? null,
          contactsVisibleAfterEngagement: Boolean(agentCard.contactsVisibleAfterEngagement),
          contractVisibleAfterEngagement: Boolean(agentCard.contractVisibleAfterEngagement)
        },
        create: {
          playerId,
          cooperationUntil: agentCard.cooperationUntil ?? null,
          potentialText: agentCard.potentialText ?? null,
          skillsText: agentCard.skillsText ?? null,
          contractStatusText: agentCard.contractStatusText ?? null,
          contactsText: agentCard.contactsText ?? null,
          contactsVisibleAfterEngagement: Boolean(agentCard.contactsVisibleAfterEngagement),
          contractVisibleAfterEngagement: Boolean(agentCard.contractVisibleAfterEngagement)
        }
      });
    }
    return this.prisma.player.update({ where: { id: playerId }, data });
  }

  private async isParentOfPlayer(playerId: string, userId: string) {
    const parent = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) return false;
    const link = await this.prisma.playerParent.findUnique({
      where: { playerId_parentId: { playerId, parentId: parent.id } }
    });
    return Boolean(link);
  }

  private async canEdit(player: { id: string; userId: string }, user: { id: string; role: UserRole }) {
    if (user.role === UserRole.ADMIN) return true;
    if (player.userId === user.id) return true;
    if (user.role === UserRole.PARENT) {
      return this.isParentOfPlayer(player.id, user.id);
    }
    return false;
  }

  private async sanitizeAgentCard(
    agentCard: any | null,
    player: { id: string; userId: string },
    user?: { id: string; role: UserRole }
  ) {
    if (!agentCard) return null;
    if (!user) return agentCard;
    if (user.role === UserRole.ADMIN) return agentCard;
    if (user.role === UserRole.PLAYER && player.userId === user.id) return agentCard;
    if (user.role === UserRole.PARENT) {
      const isParent = await this.isParentOfPlayer(player.id, user.id);
      if (isParent) return agentCard;
    }
    if (user.role === UserRole.SCOUT || user.role === UserRole.CLUB) {
      const needsEngagement =
        agentCard.contactsVisibleAfterEngagement || agentCard.contractVisibleAfterEngagement;
      let hasEngagement = false;
      if (needsEngagement) {
        const existing = await this.prisma.engagementRequest.findFirst({
          where: {
            initiatorUserId: user.id,
            playerId: player.id,
            status: EngagementRequestStatus.ACCEPTED
          }
        });
        hasEngagement = Boolean(existing);
      }
      return {
        ...agentCard,
        contactsText: agentCard.contactsVisibleAfterEngagement && !hasEngagement ? null : agentCard.contactsText,
        contractStatusText: agentCard.contractVisibleAfterEngagement && !hasEngagement ? null : agentCard.contractStatusText
      };
    }
    return agentCard;
  }

  private async ensureParentProfile(userId: string) {
    const existing = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.parentProfile.create({
      data: { userId }
    });
  }

  async addStatLine(playerId: string, payload: any, user: { id: string; role: UserRole }) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException("Player not found");
    if (!(await this.canEdit(player, user))) throw new ForbiddenException("Нет прав на редактирование");
    return this.prisma.playerStatLine.create({
      data: {
        playerId,
        seasonId: payload.seasonId,
        teamId: payload.teamId,
        leagueId: payload.leagueId,
        gamesPlayed: payload.gamesPlayed,
        goals: payload.goals,
        assists: payload.assists,
        points: payload.points,
        pim: payload.pim,
        plusMinus: payload.plusMinus
      }
    });
  }

  async updateStatLine(statId: string, payload: any, user: { id: string; role: UserRole }) {
    const stat = await this.prisma.playerStatLine.findUnique({ where: { id: statId }, include: { player: true } });
    if (!stat) throw new NotFoundException("Stat not found");
    if (!(await this.canEdit(stat.player, user))) throw new ForbiddenException("Нет прав на редактирование");
    return this.prisma.playerStatLine.update({
      where: { id: statId },
      data: {
        seasonId: payload.seasonId,
        teamId: payload.teamId,
        leagueId: payload.leagueId,
        gamesPlayed: payload.gamesPlayed,
        goals: payload.goals,
        assists: payload.assists,
        points: payload.points,
        pim: payload.pim,
        plusMinus: payload.plusMinus
      }
    });
  }

  async deleteStatLine(statId: string, user: { id: string; role: UserRole }) {
    const stat = await this.prisma.playerStatLine.findUnique({ where: { id: statId }, include: { player: true } });
    if (!stat) throw new NotFoundException("Stat not found");
    if (!(await this.canEdit(stat.player, user))) throw new ForbiddenException("Нет прав на удаление");
    await this.prisma.playerStatLine.delete({ where: { id: statId } });
    return { message: "Удалено" };
  }

  async addHistory(playerId: string, payload: any, user: { id: string; role: UserRole }) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException("Player not found");
    if (!(await this.canEdit(player, user))) throw new ForbiddenException("Нет прав на редактирование");
    return this.prisma.playerClubHistory.create({
      data: {
        playerId,
        clubId: payload.clubId,
        leagueId: payload.leagueId,
        seasonId: payload.seasonId,
        comment: payload.comment
      }
    });
  }

  async updateHistory(historyId: string, payload: any, user: { id: string; role: UserRole }) {
    const history = await this.prisma.playerClubHistory.findUnique({ where: { id: historyId }, include: { player: true } });
    if (!history) throw new NotFoundException("History not found");
    if (!(await this.canEdit(history.player, user))) throw new ForbiddenException("Нет прав на редактирование");
    return this.prisma.playerClubHistory.update({
      where: { id: historyId },
      data: {
        clubId: payload.clubId,
        leagueId: payload.leagueId,
        seasonId: payload.seasonId,
        comment: payload.comment
      }
    });
  }

  async deleteHistory(historyId: string, user: { id: string; role: UserRole }) {
    const history = await this.prisma.playerClubHistory.findUnique({ where: { id: historyId }, include: { player: true } });
    if (!history) throw new NotFoundException("History not found");
    if (!(await this.canEdit(history.player, user))) throw new ForbiddenException("Нет прав на удаление");
    await this.prisma.playerClubHistory.delete({ where: { id: historyId } });
    return { message: "Удалено" };
  }

  async addAchievement(playerId: string, payload: any, user: { id: string; role: UserRole }) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException("Player not found");
    if (!(await this.canEdit(player, user))) throw new ForbiddenException("Нет прав на редактирование");
    return this.prisma.playerAchievement.create({
      data: {
        playerId,
        year: payload.year,
        tournament: payload.tournament,
        result: payload.result,
        comment: payload.comment
      }
    });
  }

  async updateAchievement(achievementId: string, payload: any, user: { id: string; role: UserRole }) {
    const achievement = await this.prisma.playerAchievement.findUnique({ where: { id: achievementId }, include: { player: true } });
    if (!achievement) throw new NotFoundException("Achievement not found");
    if (!(await this.canEdit(achievement.player, user))) throw new ForbiddenException("Нет прав на редактирование");
    return this.prisma.playerAchievement.update({
      where: { id: achievementId },
      data: {
        year: payload.year,
        tournament: payload.tournament,
        result: payload.result,
        comment: payload.comment
      }
    });
  }

  async deleteAchievement(achievementId: string, user: { id: string; role: UserRole }) {
    const achievement = await this.prisma.playerAchievement.findUnique({ where: { id: achievementId }, include: { player: true } });
    if (!achievement) throw new NotFoundException("Achievement not found");
    if (!(await this.canEdit(achievement.player, user))) throw new ForbiddenException("Нет прав на удаление");
    await this.prisma.playerAchievement.delete({ where: { id: achievementId } });
    return { message: "Удалено" };
  }
}
