import { Body, Controller, ForbiddenException, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { VacanciesService } from "./vacancies.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateVacancyDto } from "./dto/create-vacancy.dto";
import { UpdateVacancyDto } from "./dto/update-vacancy.dto";
import { CreateVacancyApplicationDto } from "./dto/create-application.dto";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";

@Controller()
export class VacanciesController {
  constructor(private readonly vacanciesService: VacanciesService) {}

  @Get("vacancies")
  listPublic() {
    return this.vacanciesService.listPublic();
  }

  @Get("vacancies/:id")
  getPublic(@Param("id") id: string) {
    return this.vacanciesService.getPublic(id);
  }

  @Get("club/vacancies")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("CLUB")
  listClub(@CurrentUser() user: any) {
    return this.vacanciesService.listClub(user.id);
  }

  @Get("club/vacancies/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("CLUB")
  getClub(@Param("id") id: string, @CurrentUser() user: any) {
    return this.vacanciesService.getClub(user.id, id);
  }

  @Post("club/vacancies")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("CLUB")
  create(@CurrentUser() user: any, @Body() payload: CreateVacancyDto) {
    return this.vacanciesService.create(user.id, payload);
  }

  @Put("club/vacancies/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("CLUB")
  update(@Param("id") id: string, @CurrentUser() user: any, @Body() payload: UpdateVacancyDto) {
    return this.vacanciesService.update(user.id, id, payload);
  }

  @Post("club/vacancies/:id/submit")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("CLUB")
  submit(@Param("id") id: string, @CurrentUser() user: any) {
    return this.vacanciesService.submit(user.id, id);
  }

  @Post("club/vacancies/:id/archive")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("CLUB")
  archive(@Param("id") id: string, @CurrentUser() user: any) {
    return this.vacanciesService.archive(user.id, id);
  }

  @Post("vacancies/:id/applications")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("PLAYER", "PARENT")
  async apply(@Param("id") id: string, @CurrentUser() user: any, @Body() payload: CreateVacancyApplicationDto) {
    if (user.role === "PLAYER") {
      const playerId = await this.vacanciesService.getPlayerId(user.id);
      return this.vacanciesService.apply(playerId, id, payload);
    }
    if (payload.playerId) {
      await this.vacanciesService.ensureParentOwnsPlayer(user.id, payload.playerId);
      return this.vacanciesService.apply(payload.playerId, id, payload);
    }
    const playerIds = await this.vacanciesService.getParentPlayerIds(user.id);
    if (playerIds.length === 0) throw new ForbiddenException("Нет профиля игрока");
    return this.vacanciesService.apply(playerIds[0], id, payload);
  }

  @Get("player/applications")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("PLAYER")
  async myApplications(@CurrentUser() user: any) {
    const playerId = await this.vacanciesService.getPlayerId(user.id);
    return this.vacanciesService.listMyApplications(playerId);
  }

  @Get("parent/applications")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("PARENT")
  async parentApplications(@CurrentUser() user: any, @Query("playerId") playerId?: string) {
    if (playerId) {
      await this.vacanciesService.ensureParentOwnsPlayer(user.id, playerId);
      return this.vacanciesService.listMyApplications(playerId);
    }
    const playerIds = await this.vacanciesService.getParentPlayerIds(user.id);
    const results = await Promise.all(playerIds.map((id) => this.vacanciesService.listMyApplications(id)));
    return results.flat();
  }

  @Post("applications/:id/withdraw")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("PLAYER", "PARENT")
  async withdraw(@Param("id") id: string, @CurrentUser() user: any) {
    if (user.role === "PLAYER") {
      const playerId = await this.vacanciesService.getPlayerId(user.id);
      return this.vacanciesService.withdraw(playerId, id);
    }
    return this.vacanciesService.withdrawForParent(user.id, id);
  }

  @Get("club/vacancies/:id/applications")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("CLUB")
  listApplications(@Param("id") id: string, @CurrentUser() user: any) {
    return this.vacanciesService.listApplications(user.id, id);
  }

  @Put("club/applications/:id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("CLUB")
  updateApplicationStatus(@Param("id") id: string, @CurrentUser() user: any, @Body() payload: UpdateApplicationStatusDto) {
    return this.vacanciesService.updateApplicationStatus(user.id, id, payload);
  }
}
