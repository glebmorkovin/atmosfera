import { Controller, Get, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ProfileViewsService } from "./profile-views.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Controller("profile-views")
@UseGuards(JwtAuthGuard)
export class ProfileViewsController {
  constructor(private readonly profileViewsService: ProfileViewsService, private readonly prisma: PrismaService) {}

  @Get(":playerId/stats")
  async stats(
    @Param("playerId") playerId: string,
    @Param("days", ParseIntPipe) days?: number,
    @CurrentUser() user?: any
  ) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player || player.userId !== user?.id) {
      throw new Error("Нет доступа к статистике");
    }
    const interval = days && [7, 30, 90].includes(days) ? days : 30;
    return this.profileViewsService.stats(playerId, interval);
  }
}
