import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EngagementRequestStatus, NotificationType } from "@prisma/client";
import ExcelJS from "exceljs";
import { UpdateShortlistPlayerMetaDto } from "./dto/update-shortlist-player-meta.dto";

@Injectable()
export class ShortlistsService {
  constructor(private readonly prisma: PrismaService, private readonly notificationsService: NotificationsService) {}

  async list(ownerUserId?: string) {
    const items = await this.prisma.shortlist.findMany({
      where: ownerUserId ? { ownerUserId } : undefined,
      include: {
        players: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                currentClub: { select: { name: true } },
                currentLeague: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return items.map((sl) => ({
      ...sl,
      players: sl.players.map((p) => p.player)
    }));
  }

  async getById(id: string, ownerUserId?: string) {
    const sl = await this.prisma.shortlist.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                dateOfBirth: true,
                city: true,
                country: true,
                heightCm: true,
                weightKg: true,
                currentClub: { select: { name: true } },
                currentLeague: { select: { name: true } },
                agentCard: true
              }
            }
          }
        }
      }
    });
    if (!sl || (ownerUserId && sl.ownerUserId !== ownerUserId)) throw new NotFoundException("Shortlist not found");
    const players = await Promise.all(
      sl.players.map(async (p) => {
        const agentCard = await this.sanitizeAgentCard(p.player.agentCard, p.player, ownerUserId);
        return {
          ...p.player,
          agentCard,
          meta: {
            rating: p.rating,
            tags: p.tags,
            note: p.note
          }
        };
      })
    );
    return { ...sl, players };
  }

  async create(name: string, description: string | undefined, ownerUserId: string) {
    const entry = await this.prisma.shortlist.create({
      data: { name, description, ownerUserId }
    });
    return this.getById(entry.id, ownerUserId);
  }

  async addPlayer(shortlistId: string, playerId: string, ownerUserId: string) {
    const sl = await this.prisma.shortlist.findUnique({ where: { id: shortlistId } });
    if (!sl || sl.ownerUserId !== ownerUserId) throw new NotFoundException("Shortlist not found");
    await this.prisma.shortlistPlayer.upsert({
      where: { shortlistId_playerId: { shortlistId, playerId } },
      update: {},
      create: { shortlistId, playerId, tags: [] }
    });
    const player = await this.prisma.player.findUnique({ where: { id: playerId }, select: { userId: true } });
    if (player?.userId && player.userId !== ownerUserId) {
      await this.notificationsService.create(
        player.userId,
        NotificationType.SHORTLIST_ADD,
        "Ваш профиль добавлен в шортлист",
        "Скаут добавил вас в подборку",
        { shortlistId }
      );
    }
    return this.getById(shortlistId, ownerUserId);
  }

  async removePlayer(shortlistId: string, playerId: string, ownerUserId: string) {
    const sl = await this.prisma.shortlist.findUnique({ where: { id: shortlistId } });
    if (!sl || sl.ownerUserId !== ownerUserId) throw new NotFoundException("Shortlist not found");
    await this.prisma.shortlistPlayer.deleteMany({ where: { shortlistId, playerId } });
    return this.getById(shortlistId, ownerUserId);
  }

  async deleteShortlist(shortlistId: string, ownerUserId: string) {
    const sl = await this.prisma.shortlist.findUnique({ where: { id: shortlistId } });
    if (!sl || sl.ownerUserId !== ownerUserId) throw new NotFoundException("Shortlist not found");
    await this.prisma.shortlistPlayer.deleteMany({ where: { shortlistId } });
    await this.prisma.shortlist.delete({ where: { id: shortlistId } });
    return { message: "Удалено" };
  }

  async updatePlayerMeta(shortlistId: string, playerId: string, ownerUserId: string, payload: UpdateShortlistPlayerMetaDto) {
    const sl = await this.prisma.shortlist.findUnique({ where: { id: shortlistId } });
    if (!sl || sl.ownerUserId !== ownerUserId) throw new NotFoundException("Shortlist not found");
    const entry = await this.prisma.shortlistPlayer.findUnique({
      where: { shortlistId_playerId: { shortlistId, playerId } }
    });
    if (!entry) throw new NotFoundException("Player not found in shortlist");
    const data: any = {};
    if ("rating" in payload) data.rating = payload.rating;
    if ("tags" in payload) data.tags = payload.tags ?? [];
    if ("note" in payload) data.note = payload.note ?? null;
    await this.prisma.shortlistPlayer.update({
      where: { shortlistId_playerId: { shortlistId, playerId } },
      data
    });
    return this.getById(shortlistId, ownerUserId);
  }

  async export(shortlistId: string, ownerUserId: string, format: string) {
    const sl = await this.prisma.shortlist.findUnique({
      where: { id: shortlistId },
      include: {
        players: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                currentClub: { select: { name: true } },
                currentLeague: { select: { name: true } }
              }
            }
          }
        }
      }
    });
    if (!sl || sl.ownerUserId !== ownerUserId) throw new NotFoundException("Shortlist not found");

    // CSV
    const header = ["id", "firstName", "lastName", "position", "club", "league", "rating", "tags", "note"];
    const lines = sl.players.map((p) => {
      const pl = p.player;
      return [
        pl.id,
        pl.firstName,
        pl.lastName,
        pl.position,
        pl.currentClub?.name || "",
        pl.currentLeague?.name || "",
        p.rating ?? "",
        (p.tags || []).join("|"),
        p.note || ""
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",");
    });
    const body = [header.join(","), ...lines].join("\n");
    const csvPayload = {
      contentType: "text/csv",
      extension: "csv",
      body
    };

    if (format !== "xlsx") {
      return csvPayload;
    }

    // XLSX
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Shortlist");
    sheet.columns = [
      { header: "ID", key: "id", width: 20 },
      { header: "Имя", key: "firstName", width: 20 },
      { header: "Фамилия", key: "lastName", width: 20 },
      { header: "Позиция", key: "position", width: 10 },
      { header: "Клуб", key: "club", width: 25 },
      { header: "Лига", key: "league", width: 20 },
      { header: "Рейтинг", key: "rating", width: 10 },
      { header: "Теги", key: "tags", width: 25 },
      { header: "Заметка", key: "note", width: 30 }
    ];
    sl.players.forEach((p) => {
      const pl = p.player;
      sheet.addRow({
        id: pl.id,
        firstName: pl.firstName,
        lastName: pl.lastName,
        position: pl.position,
        club: pl.currentClub?.name || "",
        league: pl.currentLeague?.name || "",
        rating: p.rating ?? "",
        tags: (p.tags || []).join(", "),
        note: p.note || ""
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: "xlsx",
      body: Buffer.from(buffer)
    };
  }

  private async sanitizeAgentCard(agentCard: any | null, player: { id: string }, ownerUserId?: string) {
    if (!agentCard) return null;
    if (!ownerUserId) return agentCard;
    const existing = await this.prisma.engagementRequest.findFirst({
      where: {
        initiatorUserId: ownerUserId,
        playerId: player.id,
        status: EngagementRequestStatus.ACCEPTED
      }
    });
    const hasEngagement = Boolean(existing);
    return {
      ...agentCard,
      contactsText: agentCard.contactsVisibleAfterEngagement && !hasEngagement ? null : agentCard.contactsText,
      contractStatusText: agentCard.contractVisibleAfterEngagement && !hasEngagement ? null : agentCard.contractStatusText
    };
  }
}
