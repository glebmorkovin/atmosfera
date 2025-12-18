import { Body, Controller, Delete, Get, Param, Post, Query, Res, UseGuards } from "@nestjs/common";
import { ShortlistsService } from "./shortlists.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Response } from "express";

@Controller("shortlists")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SCOUT", "ADMIN")
export class ShortlistsController {
  constructor(private readonly shortlistsService: ShortlistsService) {}

  @Get()
  getShortlists(@CurrentUser() user: any) {
    return this.shortlistsService.list(user?.id);
  }

  @Get(":id")
  getShortlist(@Param("id") id: string, @CurrentUser() user: any) {
    return this.shortlistsService.getById(id, user?.id);
  }

  @Post()
  createShortlist(@Body() payload: { name: string; description?: string }, @CurrentUser() user: any) {
    return this.shortlistsService.create(payload.name, payload.description, user.id);
  }

  @Post(":id/players")
  addPlayer(@Param("id") id: string, @Body() payload: { playerId: string }, @CurrentUser() user: any) {
    return this.shortlistsService.addPlayer(id, payload.playerId, user.id);
  }

  @Delete(":id/players/:playerId")
  removePlayer(@Param("id") id: string, @Param("playerId") playerId: string, @CurrentUser() user: any) {
    return this.shortlistsService.removePlayer(id, playerId, user.id);
  }

  @Delete(":id")
  deleteShortlist(@Param("id") id: string, @CurrentUser() user: any) {
    return this.shortlistsService.deleteShortlist(id, user.id);
  }

  @Get(":id/export")
  async exportShortlist(
    @Param("id") id: string,
    @Query("format") format = "csv",
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    const payload = await this.shortlistsService.export(id, user.id, format);
    res.setHeader("Content-Type", payload.contentType);
    res.setHeader("Content-Disposition", `attachment; filename=\"shortlist-${id}.${payload.extension}\"`);
    res.send(payload.body);
  }
}
