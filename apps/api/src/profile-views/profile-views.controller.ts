import { Controller, ForbiddenException, Get, NotFoundException, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { ProfileViewsService } from "./profile-views.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("profile-views")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("PLAYER", "PARENT", "ADMIN")
export class ProfileViewsController {
  constructor(private readonly profileViewsService: ProfileViewsService, private readonly prisma: PrismaService) {}

  @Get(":playerId/stats")
  async stats(
    @Param("playerId") playerId: string,
    @Query("days", new ParseIntPipe({ optional: true })) days?: number,
    @CurrentUser() user?: any
  ) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { parents: { include: { parent: true } } }
    });
    if (!player) {
      throw new NotFoundException("Player not found");
    }
    const isOwner = player.userId === user?.id;
    const isParent = player.parents.some((link) => link.parent.userId === user?.id);
    const isAdmin = user?.role === "ADMIN";
    if (!isOwner && !isParent && !isAdmin) {
      throw new ForbiddenException("Нет доступа к статистике");
    }
    const interval = days && [7, 30, 90].includes(days) ? days : 30;
    return this.profileViewsService.stats(playerId, interval);
  }
}
