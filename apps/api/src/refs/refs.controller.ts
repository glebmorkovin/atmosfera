import { Controller, Get, Query } from "@nestjs/common";
import { RefsService } from "./refs.service";

@Controller("refs")
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
