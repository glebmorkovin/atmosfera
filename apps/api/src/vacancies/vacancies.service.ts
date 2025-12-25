import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { VacancyApplicationStatus, VacancyStatus, VacancyType } from "@prisma/client";
import { CreateVacancyDto } from "./dto/create-vacancy.dto";
import { UpdateVacancyDto } from "./dto/update-vacancy.dto";
import { CreateVacancyApplicationDto } from "./dto/create-application.dto";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";

@Injectable()
export class VacanciesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    return this.prisma.vacancy.findMany({
      where: { status: VacancyStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        positions: true,
        ageFrom: true,
        ageTo: true,
        locationCity: true,
        locationCountry: true,
        publishedAt: true,
        clubUser: { select: { firstName: true, lastName: true } }
      }
    });
  }

  async getPublic(id: string) {
    const vacancy = await this.prisma.vacancy.findFirst({
      where: { id, status: VacancyStatus.PUBLISHED },
      include: { clubUser: { select: { firstName: true, lastName: true } }, league: true }
    });
    if (!vacancy) throw new NotFoundException("Вакансия не найдена");
    return vacancy;
  }

  async listClub(clubUserId: string) {
    return this.prisma.vacancy.findMany({
      where: { clubUserId },
      orderBy: { updatedAt: "desc" },
      include: {
        league: true,
        _count: { select: { applications: true } }
      }
    });
  }

  async getClub(clubUserId: string, vacancyId: string) {
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { id: vacancyId },
      include: { league: true, applications: { include: { player: true } } }
    });
    if (!vacancy || vacancy.clubUserId !== clubUserId) throw new NotFoundException("Вакансия не найдена");
    return vacancy;
  }

  async create(clubUserId: string, payload: CreateVacancyDto) {
    this.validateAge(payload.ageFrom, payload.ageTo);
    return this.prisma.vacancy.create({
      data: {
        clubUserId,
        title: payload.title,
        type: payload.type || VacancyType.OTHER,
        positions: payload.positions || [],
        ageFrom: payload.ageFrom,
        ageTo: payload.ageTo,
        locationCountry: payload.locationCountry,
        locationCity: payload.locationCity,
        leagueId: payload.leagueId,
        description: payload.description,
        requirements: payload.requirements,
        conditions: payload.conditions,
        applicationDeadline: payload.applicationDeadline ? new Date(payload.applicationDeadline) : null,
        contactMode: payload.contactMode,
        status: VacancyStatus.DRAFT
      }
    });
  }

  async update(clubUserId: string, vacancyId: string, payload: UpdateVacancyDto) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy || vacancy.clubUserId !== clubUserId) throw new NotFoundException("Вакансия не найдена");
    if (vacancy.status === VacancyStatus.PUBLISHED || vacancy.status === VacancyStatus.PENDING_MODERATION) {
      throw new ConflictException("Нельзя редактировать опубликованную вакансию");
    }
    this.validateAge(payload.ageFrom ?? vacancy.ageFrom, payload.ageTo ?? vacancy.ageTo);
    return this.prisma.vacancy.update({
      where: { id: vacancyId },
      data: {
        title: payload.title,
        type: payload.type,
        positions: payload.positions,
        ageFrom: payload.ageFrom,
        ageTo: payload.ageTo,
        locationCountry: payload.locationCountry,
        locationCity: payload.locationCity,
        leagueId: payload.leagueId,
        description: payload.description,
        requirements: payload.requirements,
        conditions: payload.conditions,
        applicationDeadline: payload.applicationDeadline ? new Date(payload.applicationDeadline) : null,
        contactMode: payload.contactMode,
        status: payload.status
      }
    });
  }

  async submit(clubUserId: string, vacancyId: string) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy || vacancy.clubUserId !== clubUserId) throw new NotFoundException("Вакансия не найдена");
    const missingRequired =
      !vacancy.title ||
      !vacancy.description ||
      !vacancy.requirements ||
      !vacancy.locationCity ||
      !vacancy.locationCountry ||
      vacancy.ageFrom === null ||
      vacancy.ageFrom === undefined ||
      vacancy.ageTo === null ||
      vacancy.ageTo === undefined ||
      !vacancy.positions?.length;
    if (missingRequired) {
      throw new BadRequestException("Заполните обязательные поля");
    }
    this.validateAge(vacancy.ageFrom, vacancy.ageTo);
    if (vacancy.applicationDeadline && vacancy.applicationDeadline < new Date()) {
      throw new BadRequestException("Дедлайн не может быть в прошлом");
    }
    return this.prisma.vacancy.update({
      where: { id: vacancyId },
      data: { status: VacancyStatus.PENDING_MODERATION }
    });
  }

  async archive(clubUserId: string, vacancyId: string) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy || vacancy.clubUserId !== clubUserId) throw new NotFoundException("Вакансия не найдена");
    return this.prisma.vacancy.update({
      where: { id: vacancyId },
      data: { status: VacancyStatus.ARCHIVED }
    });
  }

  async apply(playerId: string, vacancyId: string, payload: CreateVacancyApplicationDto) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy || vacancy.status !== VacancyStatus.PUBLISHED) throw new NotFoundException("Вакансия не найдена");
    const existing = await this.prisma.vacancyApplication.findUnique({
      where: { vacancyId_playerId: { vacancyId, playerId } }
    });
    if (existing && existing.status !== VacancyApplicationStatus.WITHDRAWN) {
      throw new ConflictException("Вы уже откликались на эту вакансию");
    }
    if (existing && existing.status === VacancyApplicationStatus.WITHDRAWN) {
      return this.prisma.vacancyApplication.update({
        where: { id: existing.id },
        data: {
          status: VacancyApplicationStatus.SENT,
          messageFromPlayer: payload.messageFromPlayer
        }
      });
    }
    return this.prisma.vacancyApplication.create({
      data: {
        vacancyId,
        playerId,
        status: VacancyApplicationStatus.SENT,
        messageFromPlayer: payload.messageFromPlayer
      }
    });
  }

  async listMyApplications(playerId: string) {
    return this.prisma.vacancyApplication.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
      include: {
        player: { select: { id: true, firstName: true, lastName: true } },
        vacancy: {
          select: {
            id: true,
            title: true,
            status: true,
            clubUser: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });
  }

  async withdraw(playerId: string, applicationId: string) {
    const app = await this.prisma.vacancyApplication.findUnique({ where: { id: applicationId } });
    if (!app || app.playerId !== playerId) throw new NotFoundException("Отклик не найден");
    if (app.status === VacancyApplicationStatus.WITHDRAWN) return app;
    return this.prisma.vacancyApplication.update({
      where: { id: applicationId },
      data: { status: VacancyApplicationStatus.WITHDRAWN }
    });
  }

  async listApplications(clubUserId: string, vacancyId: string) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy || vacancy.clubUserId !== clubUserId) throw new NotFoundException("Вакансия не найдена");
    return this.prisma.vacancyApplication.findMany({
      where: { vacancyId },
      orderBy: { createdAt: "desc" },
      include: { player: true }
    });
  }

  async updateApplicationStatus(clubUserId: string, applicationId: string, payload: UpdateApplicationStatusDto) {
    const app = await this.prisma.vacancyApplication.findUnique({ where: { id: applicationId }, include: { vacancy: true } });
    if (!app || app.vacancy.clubUserId !== clubUserId) throw new NotFoundException("Отклик не найден");
    return this.prisma.vacancyApplication.update({
      where: { id: applicationId },
      data: { status: payload.status, messageFromClub: payload.messageFromClub }
    });
  }

  async getPlayerId(userId: string) {
    const player = await this.prisma.player.findUnique({ where: { userId } });
    if (!player) throw new ForbiddenException("Профиль игрока не найден");
    return player.id;
  }

  async getParentPlayerIds(userId: string) {
    const parent = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) return [];
    const links = await this.prisma.playerParent.findMany({ where: { parentId: parent.id } });
    return links.map((l) => l.playerId);
  }

  async ensureParentOwnsPlayer(userId: string, playerId: string) {
    const parent = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw new ForbiddenException("Нет доступа");
    const link = await this.prisma.playerParent.findUnique({
      where: { playerId_parentId: { playerId, parentId: parent.id } }
    });
    if (!link) throw new ForbiddenException("Нет доступа");
  }

  async withdrawForParent(userId: string, applicationId: string) {
    const app = await this.prisma.vacancyApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException("Отклик не найден");
    await this.ensureParentOwnsPlayer(userId, app.playerId);
    if (app.status === VacancyApplicationStatus.WITHDRAWN) return app;
    return this.prisma.vacancyApplication.update({
      where: { id: applicationId },
      data: { status: VacancyApplicationStatus.WITHDRAWN }
    });
  }

  private validateAge(ageFrom?: number | null, ageTo?: number | null) {
    if (typeof ageFrom === "number" && typeof ageTo === "number" && ageFrom > ageTo) {
      throw new BadRequestException("Возраст от не может быть больше возраста до");
    }
  }
}
