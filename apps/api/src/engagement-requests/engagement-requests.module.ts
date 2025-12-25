import { Module } from "@nestjs/common";
import { EngagementRequestsController } from "./engagement-requests.controller";
import { EngagementRequestsService } from "./engagement-requests.service";
import { PrismaService } from "../prisma/prisma.service";
import { WorkingCardsModule } from "../working-cards/working-cards.module";

@Module({
  imports: [WorkingCardsModule],
  controllers: [EngagementRequestsController],
  providers: [EngagementRequestsService, PrismaService]
})
export class EngagementRequestsModule {}
