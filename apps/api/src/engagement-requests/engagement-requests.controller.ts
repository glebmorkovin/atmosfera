import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { EngagementRequestsService } from "./engagement-requests.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateEngagementRequestDto } from "./dto/create-request.dto";

@Controller("engagement-requests")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngagementRequestsController {
  constructor(private readonly engagementRequestsService: EngagementRequestsService) {}

  @Post()
  @Roles("SCOUT", "CLUB")
  create(@CurrentUser() user: any, @Body() payload: CreateEngagementRequestDto) {
    return this.engagementRequestsService.createRequest(user.id, payload.playerId, payload.message);
  }

  @Get("outbox")
  @Roles("SCOUT", "CLUB")
  listOutbox(@CurrentUser() user: any) {
    return this.engagementRequestsService.listOutbox(user.id);
  }

  @Get("inbox")
  @Roles("PLAYER", "PARENT")
  listInbox(@CurrentUser() user: any) {
    return this.engagementRequestsService.listInbox(user);
  }

  @Post(":id/accept")
  @Roles("PLAYER", "PARENT")
  accept(@Param("id") id: string, @CurrentUser() user: any) {
    return this.engagementRequestsService.acceptRequest(id, user);
  }

  @Post(":id/decline")
  @Roles("PLAYER", "PARENT")
  decline(@Param("id") id: string, @CurrentUser() user: any) {
    return this.engagementRequestsService.declineRequest(id, user);
  }

  @Post(":id/cancel")
  @Roles("SCOUT", "CLUB")
  cancel(@Param("id") id: string, @CurrentUser() user: any) {
    return this.engagementRequestsService.cancelRequest(id, user);
  }
}
