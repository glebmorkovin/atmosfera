import { Module } from "@nestjs/common";
import { ProfileViewsService } from "./profile-views.service";
import { ProfileViewsController } from "./profile-views.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ProfileViewsController],
  providers: [ProfileViewsService]
})
export class ProfileViewsModule {}
