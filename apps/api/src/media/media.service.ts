import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MediaStatus, UserRole } from "@prisma/client";

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  private canEdit(ownerUserId: string, user: { id: string; role: UserRole }) {
    if (user.role === UserRole.ADMIN) return true;
    if (ownerUserId === user.id) return true;
    return false;
  }

  async create(payload: any, user: { id: string; role: UserRole }) {
    const ownerUserId = payload.ownerUserId || user.id;
    if (!this.canEdit(ownerUserId, user)) throw new ForbiddenException("Нет прав");
    const data: any = {
      ownerUserId,
      playerId: payload.playerId,
      mediaType: payload.mediaType,
      urlOrPath: payload.urlOrPath,
      title: payload.title,
      description: payload.description,
      isProfileMain: payload.isProfileMain || false,
      status: MediaStatus.PENDING
    };
    const media = await this.prisma.media.create({ data });
    if (data.isProfileMain && data.playerId) {
      await this.prisma.player.update({ where: { id: data.playerId }, data: { mainPhotoId: media.id } });
    }
    return media;
  }

  async setMain(mediaId: string, user: { id: string; role: UserRole }) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException("Media not found");
    if (!this.canEdit(media.ownerUserId, user)) throw new ForbiddenException("Нет прав");
    await this.prisma.media.updateMany({
      where: { playerId: media.playerId },
      data: { isProfileMain: false }
    });
    const updated = await this.prisma.media.update({ where: { id: mediaId }, data: { isProfileMain: true } });
    if (media.playerId) {
      await this.prisma.player.update({ where: { id: media.playerId }, data: { mainPhotoId: mediaId } });
    }
    return updated;
  }

  async remove(mediaId: string, user: { id: string; role: UserRole }) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException("Media not found");
    if (!this.canEdit(media.ownerUserId, user)) throw new ForbiddenException("Нет прав");
    await this.prisma.media.delete({ where: { id: mediaId } });
    return { message: "Удалено" };
  }
}
