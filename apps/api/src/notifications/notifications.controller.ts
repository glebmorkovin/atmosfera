import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.notificationsService.list(user.id);
  }

  @Post(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: any) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Post("read-all")
  markAll(@CurrentUser() user: any) {
    return this.notificationsService.markAll(user.id);
  }
}
