import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { SearchFiltersService } from "./search-filters.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("search-filters")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SCOUT", "ADMIN")
export class SearchFiltersController {
  constructor(private readonly searchFiltersService: SearchFiltersService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.searchFiltersService.list(user.id);
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.searchFiltersService.getById(id, user.id);
  }

  @Post()
  create(@Body() payload: { name: string; config: Record<string, unknown> }, @CurrentUser() user: any) {
    return this.searchFiltersService.create(user.id, payload.name, payload.config);
  }

  @Delete(":id")
  delete(@Param("id") id: string, @CurrentUser() user: any) {
    return this.searchFiltersService.delete(id, user.id);
  }
}
