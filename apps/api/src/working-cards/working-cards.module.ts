import { Module } from "@nestjs/common";
import { WorkingCardsController } from "./working-cards.controller";
import { WorkingCardsService } from "./working-cards.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [WorkingCardsController],
  providers: [WorkingCardsService, PrismaService],
  exports: [WorkingCardsService]
})
export class WorkingCardsModule {}
