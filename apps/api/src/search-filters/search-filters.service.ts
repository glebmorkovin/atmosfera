import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class SearchFiltersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerUserId: string) {
    return this.prisma.savedSearchFilter.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: "desc" }
    });
  }

  async getById(id: string, ownerUserId: string) {
    const filter = await this.prisma.savedSearchFilter.findUnique({ where: { id } });
    if (!filter || filter.ownerUserId !== ownerUserId) throw new NotFoundException("Фильтр не найден");
    return filter;
  }

  async create(ownerUserId: string, name: string, config: Record<string, unknown>) {
    return this.prisma.savedSearchFilter.create({
      data: { ownerUserId, name, config: (config as Prisma.JsonValue) }
    });
  }

  async delete(id: string, ownerUserId: string) {
    const filter = await this.prisma.savedSearchFilter.findUnique({ where: { id } });
    if (!filter || filter.ownerUserId !== ownerUserId) throw new NotFoundException("Фильтр не найден");
    await this.prisma.savedSearchFilter.delete({ where: { id } });
    return { message: "Удалено" };
  }
}
