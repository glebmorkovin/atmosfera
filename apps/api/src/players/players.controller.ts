import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
  Post,
  UseGuards,
  Put
} from "@nestjs/common";
import { PlayersService } from "./players.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("players")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @Roles("SCOUT", "CLUB", "ADMIN")
  getPlayers(
    @Query("position") position?: string,
    @Query("league") league?: string,
    @Query("minAge", ParseIntPipe) minAge?: number,
    @Query("maxAge", ParseIntPipe) maxAge?: number,
    @Query("hasVideo", new ParseBoolPipe({ optional: true })) hasVideo?: boolean
  ) {
    return this.playersService.list({ position, league, minAge, maxAge, hasVideo });
  }

  @Get("me")
  @Roles("PLAYER")
  getMe(@CurrentUser() user: any) {
    return this.playersService.getSelf(user);
  }

  @Get("parent/children")
  @Roles("PARENT")
  getParentChildren(@CurrentUser() user: any) {
    return this.playersService.listParentChildren(user.id);
  }

  @Post("parent/children")
  @Roles("PARENT")
  createParentChild(@CurrentUser() user: any, @Body() payload: any) {
    return this.playersService.createParentChild(user.id, payload);
  }

  @Delete("parent/children/:playerId")
  @Roles("PARENT")
  unlinkParentChild(@CurrentUser() user: any, @Param("playerId") playerId: string) {
    return this.playersService.unlinkParentChild(user.id, playerId);
  }

  @Get("search")
  @Roles("PLAYER", "PARENT", "SCOUT", "CLUB", "ADMIN")
  searchPlayers(
    @Query("position") position?: string,
    @Query("leagueId") leagueId?: string,
    @Query("clubId") clubId?: string,
    @Query("country") country?: string,
    @Query("city") city?: string,
    @Query("minBirthYear") minBirthYear?: string,
    @Query("maxBirthYear") maxBirthYear?: string,
    @Query("minHeight") minHeight?: string,
    @Query("maxHeight") maxHeight?: string,
    @Query("minWeight") minWeight?: string,
    @Query("maxWeight") maxWeight?: string,
    @Query("hasVideo") hasVideo?: string,
    @Query("minGames") minGames?: string,
    @Query("minGoals") minGoals?: string,
    @Query("minPoints") minPoints?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @CurrentUser() user?: any
  ) {
    const toOptionalInt = (value?: string) => {
      if (value === undefined || value === null || value === "") return undefined;
      const num = Number(value);
      return Number.isFinite(num) && Number.isInteger(num) ? num : undefined;
    };
    const toOptionalBool = (value?: string) => {
      if (value === undefined || value === null || value === "") return undefined;
      return value === "true";
    };

    const parsedPage = toOptionalInt(page) ?? 1;
    const parsedPageSize = toOptionalInt(pageSize) ?? 20;

    return this.playersService.search(
      {
        position,
        leagueId,
        clubId,
        country,
        city,
        minBirthYear: toOptionalInt(minBirthYear),
        maxBirthYear: toOptionalInt(maxBirthYear),
        minHeight: toOptionalInt(minHeight),
        maxHeight: toOptionalInt(maxHeight),
        minWeight: toOptionalInt(minWeight),
        maxWeight: toOptionalInt(maxWeight),
        hasVideo: toOptionalBool(hasVideo),
        minGames: toOptionalInt(minGames),
        minGoals: toOptionalInt(minGoals),
        minPoints: toOptionalInt(minPoints)
      },
      { page: parsedPage, pageSize: parsedPageSize },
      user
    );
  }

  @Get(":id")
  @Roles("PLAYER", "PARENT", "SCOUT", "CLUB", "ADMIN")
  getPlayer(@Param("id") id: string, @CurrentUser() user: any) {
    return this.playersService.getById(id, user);
  }

  @Post(":id/view")
  @Roles("SCOUT", "CLUB", "ADMIN")
  trackView(@Param("id") id: string, @CurrentUser() user: any) {
    return this.playersService.trackView(id, user?.id);
  }

  @Put(":id")
  @Roles("PLAYER", "PARENT", "ADMIN")
  updateProfile(@Param("id") id: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.updateProfile(id, payload, user);
  }

  @Post(":id/stats")
  @Roles("PLAYER", "PARENT", "ADMIN")
  addStat(@Param("id") id: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.addStatLine(id, payload, user);
  }

  @Put("stats/:statId")
  @Roles("PLAYER", "PARENT", "ADMIN")
  updateStat(@Param("statId") statId: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.updateStatLine(statId, payload, user);
  }

  @Delete("stats/:statId")
  @Roles("PLAYER", "PARENT", "ADMIN")
  deleteStat(@Param("statId") statId: string, @CurrentUser() user: any) {
    return this.playersService.deleteStatLine(statId, user);
  }

  @Post(":id/history")
  @Roles("PLAYER", "PARENT", "ADMIN")
  addHistory(@Param("id") id: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.addHistory(id, payload, user);
  }

  @Put("history/:historyId")
  @Roles("PLAYER", "PARENT", "ADMIN")
  updateHistory(@Param("historyId") historyId: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.updateHistory(historyId, payload, user);
  }

  @Delete("history/:historyId")
  @Roles("PLAYER", "PARENT", "ADMIN")
  deleteHistory(@Param("historyId") historyId: string, @CurrentUser() user: any) {
    return this.playersService.deleteHistory(historyId, user);
  }

  @Post(":id/achievements")
  @Roles("PLAYER", "PARENT", "ADMIN")
  addAchievement(@Param("id") id: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.addAchievement(id, payload, user);
  }

  @Put("achievements/:achievementId")
  @Roles("PLAYER", "PARENT", "ADMIN")
  updateAchievement(@Param("achievementId") achievementId: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.updateAchievement(achievementId, payload, user);
  }

  @Delete("achievements/:achievementId")
  @Roles("PLAYER", "PARENT", "ADMIN")
  deleteAchievement(@Param("achievementId") achievementId: string, @CurrentUser() user: any) {
    return this.playersService.deleteAchievement(achievementId, user);
  }

}
