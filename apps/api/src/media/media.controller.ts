import { Body, Controller, Delete, Param, Post, Put, UseGuards } from "@nestjs/common";
import { MediaService } from "./media.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("media")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("PLAYER", "PARENT", "ADMIN")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  create(@Body() payload: any, @CurrentUser() user: any) {
    return this.mediaService.create(payload, user);
  }

  @Put(":id/main")
  setMain(@Param("id") id: string, @CurrentUser() user: any) {
    return this.mediaService.setMain(id, user);
  }

  @Delete(":id")
  delete(@Param("id") id: string, @CurrentUser() user: any) {
    return this.mediaService.remove(id, user);
  }
}
