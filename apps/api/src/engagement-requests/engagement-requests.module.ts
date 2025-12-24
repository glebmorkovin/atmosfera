import { Module } from "@nestjs/common";
import { EngagementRequestsController } from "./engagement-requests.controller";
import { EngagementRequestsService } from "./engagement-requests.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [EngagementRequestsController],
  providers: [EngagementRequestsService, PrismaService]
})
export class EngagementRequestsModule {}
