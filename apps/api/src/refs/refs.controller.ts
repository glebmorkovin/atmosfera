import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { RefsService } from "./refs.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("refs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("PLAYER", "PARENT", "SCOUT", "CLUB", "ADMIN")
export class RefsController {
  constructor(private readonly refsService: RefsService) {}

  @Get("leagues")
  getLeagues(@Query("q") q?: string) {
    return this.refsService.listLeagues(q);
  }

  @Get("clubs")
  getClubs(@Query("q") q?: string) {
    return this.refsService.listClubs(q);
  }

  @Get("seasons")
  getSeasons() {
    return this.refsService.listSeasons();
  }
}
