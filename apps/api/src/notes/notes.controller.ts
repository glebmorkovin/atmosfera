import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { NotesService } from "./notes.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("notes")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SCOUT", "ADMIN")
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  list(@CurrentUser() user: any, @Query("playerId") playerId?: string, @Query("shortlistId") shortlistId?: string) {
    if (playerId) return this.notesService.listByPlayer(user.id, playerId);
    if (shortlistId) return this.notesService.listByShortlist(user.id, shortlistId);
    return this.notesService.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() payload: { text: string; playerId?: string; shortlistId?: string }
  ) {
    return this.notesService.create(user.id, payload.text, payload.playerId, payload.shortlistId);
  }

  @Delete(":id")
  delete(@Param("id") id: string, @CurrentUser() user: any) {
    return this.notesService.delete(user.id, id);
  }
}
