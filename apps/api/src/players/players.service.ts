import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MediaStatus, NotificationType, UserRole } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";

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

  async getById(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: {
        currentClub: true,
        currentLeague: true,
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
    return player;
  }

  async search(filters: SearchFilters, pagination: Pagination) {
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

    const where: any = {
      isActive: true,
      isPublicInSearch: true,
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
    if (user.role !== UserRole.ADMIN && player.userId !== user.id) {
      throw new ForbiddenException("Нет прав на редактирование");
    }
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
    return this.prisma.player.update({ where: { id: playerId }, data });
  }

  private canEdit(player: { userId: string }, user: { id: string; role: UserRole }) {
    if (user.role === UserRole.ADMIN) return true;
    if (player.userId === user.id) return true;
    return false;
  }

  async addStatLine(playerId: string, payload: any, user: { id: string; role: UserRole }) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException("Player not found");
    if (!this.canEdit(player, user)) throw new ForbiddenException("Нет прав на редактирование");
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
    if (!this.canEdit(stat.player, user)) throw new ForbiddenException("Нет прав на редактирование");
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
    if (!this.canEdit(stat.player, user)) throw new ForbiddenException("Нет прав на удаление");
    await this.prisma.playerStatLine.delete({ where: { id: statId } });
    return { message: "Удалено" };
  }

  async addHistory(playerId: string, payload: any, user: { id: string; role: UserRole }) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException("Player not found");
    if (!this.canEdit(player, user)) throw new ForbiddenException("Нет прав на редактирование");
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
    if (!this.canEdit(history.player, user)) throw new ForbiddenException("Нет прав на редактирование");
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
    if (!this.canEdit(history.player, user)) throw new ForbiddenException("Нет прав на удаление");
    await this.prisma.playerClubHistory.delete({ where: { id: historyId } });
    return { message: "Удалено" };
  }

  async addAchievement(playerId: string, payload: any, user: { id: string; role: UserRole }) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException("Player not found");
    if (!this.canEdit(player, user)) throw new ForbiddenException("Нет прав на редактирование");
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
    if (!this.canEdit(achievement.player, user)) throw new ForbiddenException("Нет прав на редактирование");
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
    if (!this.canEdit(achievement.player, user)) throw new ForbiddenException("Нет прав на удаление");
    await this.prisma.playerAchievement.delete({ where: { id: achievementId } });
    return { message: "Удалено" };
  }
}
