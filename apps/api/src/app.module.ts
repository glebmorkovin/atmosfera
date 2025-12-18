import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { PlayersModule } from "./players/players.module";
import { ShortlistsModule } from "./shortlists/shortlists.module";
import { SearchFiltersModule } from "./search-filters/search-filters.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ProfileViewsModule } from "./profile-views/profile-views.module";
import { NotesModule } from "./notes/notes.module";
import { AdminModule } from "./admin/admin.module";
import { MediaModule } from "./media/media.module";
import { RefsModule } from "./refs/refs.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    PlayersModule,
    ShortlistsModule,
    SearchFiltersModule,
    NotificationsModule,
    ProfileViewsModule,
    NotesModule,
    AdminModule,
    MediaModule,
    RefsModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
