import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { WorkingCardsService } from "./working-cards.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UpdateWorkingCardDto } from "./dto/update-working-card.dto";
import { SyncApplyDto } from "./dto/sync-apply.dto";

@Controller("working-cards")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkingCardsController {
  constructor(private readonly workingCardsService: WorkingCardsService) {}

  @Get()
  @Roles("SCOUT", "CLUB")
  list(@CurrentUser() user: any) {
    return this.workingCardsService.list(user.id);
  }

  @Get(":id")
  @Roles("SCOUT", "CLUB")
  getById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.workingCardsService.getById(id, user.id);
  }

  @Put(":id")
  @Roles("SCOUT", "CLUB")
  update(@Param("id") id: string, @Body() payload: UpdateWorkingCardDto, @CurrentUser() user: any) {
    return this.workingCardsService.update(id, user.id, payload);
  }

  @Delete(":id")
  @Roles("SCOUT", "CLUB")
  archive(@Param("id") id: string, @CurrentUser() user: any) {
    return this.workingCardsService.archive(id, user.id);
  }

  @Post(":id/sync-preview")
  @Roles("SCOUT", "CLUB")
  syncPreview(@Param("id") id: string, @CurrentUser() user: any) {
    return this.workingCardsService.syncPreview(id, user.id);
  }

  @Post(":id/sync-apply")
  @Roles("SCOUT", "CLUB")
  syncApply(@Param("id") id: string, @Body() payload: SyncApplyDto, @CurrentUser() user: any) {
    return this.workingCardsService.syncApply(id, user.id, payload.fields || []);
  }
}
