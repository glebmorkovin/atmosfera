import { Module } from "@nestjs/common";
import { ShortlistsService } from "./shortlists.service";
import { ShortlistsController } from "./shortlists.controller";
import { PlayersModule } from "../players/players.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PlayersModule, NotificationsModule],
  controllers: [ShortlistsController],
  providers: [ShortlistsService]
})
export class ShortlistsModule {}
