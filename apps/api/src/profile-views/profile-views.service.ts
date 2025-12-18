import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProfileViewsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(playerId: string, days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data = await this.prisma.profileViewEvent.groupBy({
      by: ["viewedAt"],
      where: { playerId, viewedAt: { gte: since } },
      _count: true
    });

    // normalize to date string
    const buckets = data.map((item) => ({
      date: item.viewedAt.toISOString().slice(0, 10),
      count: item._count
    }));

    const total = buckets.reduce((acc, b) => acc + b.count, 0);
    return { total, buckets };
  }
}
