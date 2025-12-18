import { Module } from "@nestjs/common";
import { SearchFiltersService } from "./search-filters.service";
import { SearchFiltersController } from "./search-filters.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SearchFiltersController],
  providers: [SearchFiltersService]
})
export class SearchFiltersModule {}
