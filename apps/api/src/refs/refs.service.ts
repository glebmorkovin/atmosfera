import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RefsService {
  constructor(private readonly prisma: PrismaService) {}

  listLeagues(q?: string) {
    return this.prisma.league.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
      take: 100
    });
  }

  listClubs(q?: string) {
    return this.prisma.club.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { country: { contains: q, mode: "insensitive" } }
            ]
          }
        : undefined,
      orderBy: { name: "asc" },
      take: 100
    });
  }

  listSeasons() {
    return this.prisma.season.findMany({
      orderBy: { startYear: "desc" }
    });
  }
}
