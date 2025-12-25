import { Module } from "@nestjs/common";
import { VacanciesService } from "./vacancies.service";
import { VacanciesController } from "./vacancies.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [VacanciesController],
  providers: [VacanciesService, PrismaService]
})
export class VacanciesModule {}
