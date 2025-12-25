import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateWorkingCardDto } from "./dto/update-working-card.dto";
import { WorkingCardSource } from "@prisma/client";

const SNAPSHOT_FIELDS = [
  "fullName",
  "birthDate",
  "cityText",
  "positionText",
  "cooperationUntil",
  "potentialText",
  "skillsText",
  "contractStatusText",
  "contactsText",
  "clubText"
] as const;

type SnapshotField = (typeof SNAPSHOT_FIELDS)[number];

type Snapshot = {
  fullName: string | null;
  birthDate: Date | null;
  cityText: string | null;
  positionText: string | null;
  cooperationUntil: string | null;
  potentialText: string | null;
  skillsText: string | null;
  contractStatusText: string | null;
  contactsText: string | null;
  clubText: string | null;
};

const fieldLabels: Record<SnapshotField, string> = {
  fullName: "ФИО",
  birthDate: "Дата рождения",
  cityText: "Город",
  positionText: "Амплуа",
  cooperationUntil: "Сотрудничество",
  potentialText: "Потенциал",
  skillsText: "Скиллы",
  contractStatusText: "Состояние контракта",
  contactsText: "Контакты",
  clubText: "Клуб"
};

@Injectable()
export class WorkingCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerUserId: string) {
    return this.prisma.workingCard.findMany({
      where: { ownerUserId, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        playerId: true,
        fullName: true,
        birthDate: true,
        cityText: true,
        positionText: true,
        cooperationUntil: true,
        clubText: true,
        pipelineStatus: true,
        tags: true,
        updatedAt: true
      }
    });
  }

  async getById(cardId: string, ownerUserId: string) {
    const card = await this.prisma.workingCard.findFirst({
      where: { id: cardId, ownerUserId, archivedAt: null }
    });
    if (!card) throw new NotFoundException("Рабочая карточка не найдена");
    return card;
  }

  async update(cardId: string, ownerUserId: string, payload: UpdateWorkingCardDto) {
    await this.ensureOwner(cardId, ownerUserId);
    return this.prisma.workingCard.update({
      where: { id: cardId },
      data: {
        fullName: payload.fullName,
        birthDate: payload.birthDate ? new Date(payload.birthDate) : undefined,
        cityText: payload.cityText,
        positionText: payload.positionText,
        cooperationUntil: payload.cooperationUntil,
        potentialText: payload.potentialText,
        skillsText: payload.skillsText,
        contractStatusText: payload.contractStatusText,
        contactsText: payload.contactsText,
        clubText: payload.clubText,
        pipelineStatus: payload.pipelineStatus,
        notes: payload.notes,
        tags: payload.tags
      }
    });
  }

  async archive(cardId: string, ownerUserId: string) {
    await this.ensureOwner(cardId, ownerUserId);
    return this.prisma.workingCard.update({
      where: { id: cardId },
      data: { archivedAt: new Date() }
    });
  }

  async syncPreview(cardId: string, ownerUserId: string) {
    const card = await this.getById(cardId, ownerUserId);
    const snapshot = await this.buildSnapshot(card.playerId);
    const changes = SNAPSHOT_FIELDS.map((field) => {
      const current = this.formatValue(card[field]);
      const next = this.formatValue(snapshot[field]);
      if (current === next) return null;
      return {
        field,
        label: fieldLabels[field],
        current,
        next
      };
    }).filter(Boolean);

    return { changes };
  }

  async syncApply(cardId: string, ownerUserId: string, fields: string[]) {
    const card = await this.getById(cardId, ownerUserId);
    const snapshot = await this.buildSnapshot(card.playerId);
    const allowed = new Set(SNAPSHOT_FIELDS);
    const data: Record<string, any> = {};

    for (const field of fields) {
      if (!allowed.has(field as SnapshotField)) continue;
      const key = field as SnapshotField;
      data[key] = snapshot[key];
    }

    if (Object.keys(data).length === 0) {
      return card;
    }

    return this.prisma.workingCard.update({
      where: { id: cardId },
      data
    });
  }

  async ensureFromEngagement(initiatorUserId: string, playerId: string) {
    const snapshot = await this.buildSnapshot(playerId);
    return this.prisma.workingCard.upsert({
      where: { ownerUserId_playerId: { ownerUserId: initiatorUserId, playerId } },
      update: {
        fullName: snapshot.fullName,
        birthDate: snapshot.birthDate,
        cityText: snapshot.cityText,
        positionText: snapshot.positionText,
        cooperationUntil: snapshot.cooperationUntil,
        potentialText: snapshot.potentialText,
        skillsText: snapshot.skillsText,
        contractStatusText: snapshot.contractStatusText,
        contactsText: snapshot.contactsText,
        clubText: snapshot.clubText
      },
      create: {
        ownerUserId: initiatorUserId,
        playerId,
        source: WorkingCardSource.FROM_PROFILE,
        pipelineStatus: "Контакт установлен",
        tags: [],
        ...snapshot
      }
    });
  }

  private async ensureOwner(cardId: string, ownerUserId: string) {
    const card = await this.prisma.workingCard.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException("Рабочая карточка не найдена");
    if (card.ownerUserId !== ownerUserId) throw new ForbiddenException("Нет доступа");
    if (card.archivedAt) throw new NotFoundException("Рабочая карточка не найдена");
  }

  private async buildSnapshot(playerId: string): Promise<Snapshot> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { agentCard: true, currentClub: true }
    });
    if (!player) throw new NotFoundException("Игрок не найден");
    const agent = player.agentCard;
    return {
      fullName: [player.firstName, player.lastName].filter(Boolean).join(" ") || null,
      birthDate: player.dateOfBirth ?? null,
      cityText: player.city ?? null,
      positionText: player.position ?? null,
      cooperationUntil: agent?.cooperationUntil ?? null,
      potentialText: agent?.potentialText ?? null,
      skillsText: agent?.skillsText ?? null,
      contractStatusText: agent?.contractStatusText ?? null,
      contactsText: agent?.contactsText ?? null,
      clubText: player.currentClub?.name ?? null
    };
  }

  private formatValue(value: any) {
    if (value === null || value === undefined || value === "") return null;
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return value;
  }
}
