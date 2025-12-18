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

@Controller("players")
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  getPlayers(
    @Query("position") position?: string,
    @Query("league") league?: string,
    @Query("minAge", ParseIntPipe) minAge?: number,
    @Query("maxAge", ParseIntPipe) maxAge?: number,
    @Query("hasVideo", new ParseBoolPipe({ optional: true })) hasVideo?: boolean
  ) {
    return this.playersService.list({ position, league, minAge, maxAge, hasVideo });
  }

  @Get(":id")
  getPlayer(@Param("id") id: string) {
    return this.playersService.getById(id);
  }

  @Post(":id/view")
  @UseGuards(JwtAuthGuard)
  trackView(@Param("id") id: string, @CurrentUser() user: any) {
    return this.playersService.trackView(id, user?.id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  updateProfile(@Param("id") id: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.updateProfile(id, payload, user);
  }

  @Post(":id/stats")
  @UseGuards(JwtAuthGuard)
  addStat(@Param("id") id: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.addStatLine(id, payload, user);
  }

  @Put("stats/:statId")
  @UseGuards(JwtAuthGuard)
  updateStat(@Param("statId") statId: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.updateStatLine(statId, payload, user);
  }

  @Delete("stats/:statId")
  @UseGuards(JwtAuthGuard)
  deleteStat(@Param("statId") statId: string, @CurrentUser() user: any) {
    return this.playersService.deleteStatLine(statId, user);
  }

  @Post(":id/history")
  @UseGuards(JwtAuthGuard)
  addHistory(@Param("id") id: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.addHistory(id, payload, user);
  }

  @Put("history/:historyId")
  @UseGuards(JwtAuthGuard)
  updateHistory(@Param("historyId") historyId: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.updateHistory(historyId, payload, user);
  }

  @Delete("history/:historyId")
  @UseGuards(JwtAuthGuard)
  deleteHistory(@Param("historyId") historyId: string, @CurrentUser() user: any) {
    return this.playersService.deleteHistory(historyId, user);
  }

  @Post(":id/achievements")
  @UseGuards(JwtAuthGuard)
  addAchievement(@Param("id") id: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.addAchievement(id, payload, user);
  }

  @Put("achievements/:achievementId")
  @UseGuards(JwtAuthGuard)
  updateAchievement(@Param("achievementId") achievementId: string, @Body() payload: any, @CurrentUser() user: any) {
    return this.playersService.updateAchievement(achievementId, payload, user);
  }

  @Delete("achievements/:achievementId")
  @UseGuards(JwtAuthGuard)
  deleteAchievement(@Param("achievementId") achievementId: string, @CurrentUser() user: any) {
    return this.playersService.deleteAchievement(achievementId, user);
  }

  @Get("search")
  searchPlayers(
    @Query("position") position?: string,
    @Query("leagueId") leagueId?: string,
    @Query("clubId") clubId?: string,
    @Query("country") country?: string,
    @Query("city") city?: string,
    @Query("minBirthYear", ParseIntPipe) minBirthYear?: number,
    @Query("maxBirthYear", ParseIntPipe) maxBirthYear?: number,
    @Query("minHeight", ParseIntPipe) minHeight?: number,
    @Query("maxHeight", ParseIntPipe) maxHeight?: number,
    @Query("minWeight", ParseIntPipe) minWeight?: number,
    @Query("maxWeight", ParseIntPipe) maxWeight?: number,
    @Query("hasVideo", new ParseBoolPipe({ optional: true })) hasVideo?: boolean,
    @Query("minGames", ParseIntPipe) minGames?: number,
    @Query("minGoals", ParseIntPipe) minGoals?: number,
    @Query("minPoints", ParseIntPipe) minPoints?: number,
    @Query("page", ParseIntPipe) page = 1,
    @Query("pageSize", ParseIntPipe) pageSize = 20
  ) {
    return this.playersService.search(
      {
        position,
        leagueId,
        clubId,
        country,
        city,
        minBirthYear,
        maxBirthYear,
        minHeight,
        maxHeight,
        minWeight,
        maxWeight,
        hasVideo,
        minGames,
        minGoals,
        minPoints
      },
      { page, pageSize }
    );
  }
}
