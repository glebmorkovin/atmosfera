import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { ModerationStatus, MediaStatus } from "@prisma/client";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  // Списки
  @Get("users")
  getUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, role: true, isActive: true, createdAt: true }
    });
  }

  @Get("media")
  getMedia() {
    return this.prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  @Get("players")
  getPlayers() {
    return this.prisma.player.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        moderationStatus: true,
        moderationComment: true,
        isPublicInSearch: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  // Пользователи: смена роли/блокировки
  @Put("users/:id/role")
  setRole(@Param("id") id: string, @Body() payload: { role: string }) {
    return this.prisma.user.update({ where: { id }, data: { role: payload.role as any } });
  }

  @Put("users/:id/status")
  setStatus(@Param("id") id: string, @Body() payload: { isActive: boolean }) {
    return this.prisma.user.update({ where: { id }, data: { isActive: payload.isActive } });
  }

  // Модерация профилей игроков
  @Put("players/:id/moderation")
  moderatePlayer(@Param("id") id: string, @Body() payload: { status: ModerationStatus; comment?: string }) {
    return this.prisma.player.update({
      where: { id },
      data: {
        moderationStatus: payload.status,
        moderationComment: payload.comment,
        isPublicInSearch: payload.status === "APPROVED"
      }
    });
  }

  // Модерация медиа
  @Put("media/:id/moderation")
  moderateMedia(@Param("id") id: string, @Body() payload: { status: MediaStatus; comment?: string }) {
    return this.prisma.media.update({
      where: { id },
      data: { status: payload.status, moderationComment: payload.comment }
    });
  }

  // Справочники: лиги, клубы, сезоны
  @Get("leagues")
  leagues() {
    return this.prisma.league.findMany({ orderBy: { name: "asc" } });
  }

  @Post("leagues")
  createLeague(@Body() payload: { name: string; country?: string; level?: string }) {
    return this.prisma.league.create({ data: payload });
  }

  @Put("leagues/:id")
  updateLeague(@Param("id") id: string, @Body() payload: { name?: string; country?: string; level?: string }) {
    return this.prisma.league.update({ where: { id }, data: payload });
  }

  @Get("clubs")
  clubs() {
    return this.prisma.club.findMany({ orderBy: { name: "asc" } });
  }

  @Post("clubs")
  createClub(@Body() payload: { name: string; country?: string; city?: string; leagueId?: string }) {
    return this.prisma.club.create({ data: payload });
  }

  @Put("clubs/:id")
  updateClub(@Param("id") id: string, @Body() payload: { name?: string; country?: string; city?: string; leagueId?: string }) {
    return this.prisma.club.update({ where: { id }, data: payload });
  }

  @Get("seasons")
  seasons() {
    return this.prisma.season.findMany({ orderBy: { startYear: "desc" } });
  }

  @Post("seasons")
  createSeason(@Body() payload: { name: string; startYear: number; endYear: number }) {
    return this.prisma.season.create({ data: payload });
  }

  @Put("seasons/:id")
  updateSeason(@Param("id") id: string, @Body() payload: { name?: string; startYear?: number; endYear?: number }) {
    return this.prisma.season.update({ where: { id }, data: payload });
  }

  // Аудит-лог
  @Get("audit")
  audit() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200
    });
  }
}
