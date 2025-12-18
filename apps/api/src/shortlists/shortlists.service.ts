import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "@prisma/client";
import ExcelJS from "exceljs";

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
                currentClub: { select: { name: true } },
                currentLeague: { select: { name: true } }
              }
            }
          }
        }
      }
    });
    if (!sl || (ownerUserId && sl.ownerUserId !== ownerUserId)) throw new NotFoundException("Shortlist not found");
    return {
      ...sl,
      players: sl.players.map((p) => p.player)
    };
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
      create: { shortlistId, playerId }
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
    const header = ["id", "firstName", "lastName", "position", "club", "league"];
    const lines = sl.players.map((p) => {
      const pl = p.player;
      return [
        pl.id,
        pl.firstName,
        pl.lastName,
        pl.position,
        pl.currentClub?.name || "",
        pl.currentLeague?.name || ""
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
      { header: "Лига", key: "league", width: 20 }
    ];
    sl.players.forEach((p) => {
      const pl = p.player;
      sheet.addRow({
        id: pl.id,
        firstName: pl.firstName,
        lastName: pl.lastName,
        position: pl.position,
        club: pl.currentClub?.name || "",
        league: pl.currentLeague?.name || ""
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: "xlsx",
      body: Buffer.from(buffer)
    };
  }
}
