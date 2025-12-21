import { Controller, Get, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("demo")
  @Roles("ADMIN")
  getDemoUsers() {
    return this.usersService.demoList();
  }

  @Get("me")
  @Roles("PLAYER", "PARENT", "SCOUT", "CLUB", "ADMIN")
  getMe(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }
}
