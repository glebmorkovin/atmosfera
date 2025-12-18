import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerUserId: string) {
    return this.prisma.note.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: "desc" }
    });
  }

  async listByPlayer(ownerUserId: string, playerId: string) {
    return this.prisma.note.findMany({
      where: { ownerUserId, playerId },
      orderBy: { createdAt: "desc" }
    });
  }

  async listByShortlist(ownerUserId: string, shortlistId: string) {
    return this.prisma.note.findMany({
      where: { ownerUserId, shortlistId },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(ownerUserId: string, text: string, playerId?: string, shortlistId?: string) {
    if (!playerId && !shortlistId) throw new NotFoundException("Нужен playerId или shortlistId");
    return this.prisma.note.create({
      data: {
        ownerUserId,
        text,
        playerId,
        shortlistId
      }
    });
  }

  async delete(ownerUserId: string, id: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note || note.ownerUserId !== ownerUserId) throw new NotFoundException("Заметка не найдена");
    await this.prisma.note.delete({ where: { id } });
    return { message: "Удалено" };
  }
}
