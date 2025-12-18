import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RefsService } from "./refs.service";
import { RefsController } from "./refs.controller";

@Module({
  imports: [PrismaModule],
  providers: [RefsService],
  controllers: [RefsController]
})
export class RefsModule {}
