import {
  EngagementRequestStatus,
  PrismaClient,
  ModerationStatus,
  Position,
  UserRole,
  WorkingCardSource,
  VacancyStatus,
  VacancyType,
  VacancyApplicationStatus
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const DEMO_PASSWORD = "password123";

export async function seedDemoUsers(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const playerUser = await prisma.user.upsert({
    where: { email: "player@example.com" },
    update: {
      passwordHash,
      role: UserRole.PLAYER,
      firstName: "Алексей",
      lastName: "К.",
      country: "Россия",
      city: "Санкт-Петербург"
    },
    create: {
      email: "player@example.com",
      passwordHash,
      role: UserRole.PLAYER,
      firstName: "Алексей",
      lastName: "К.",
      country: "Россия",
      city: "Санкт-Петербург"
    }
  });

  const scoutUser = await prisma.user.upsert({
    where: { email: "scout@example.com" },
    update: {
      passwordHash,
      role: UserRole.SCOUT,
      firstName: "Алексей",
      lastName: "Скаут",
      country: "Россия",
      city: "Москва"
    },
    create: {
      email: "scout@example.com",
      passwordHash,
      role: UserRole.SCOUT,
      firstName: "Алексей",
      lastName: "Скаут",
      country: "Россия",
      city: "Москва"
    }
  });

  const clubUser = await prisma.user.upsert({
    where: { email: "club@example.com" },
    update: {
      passwordHash,
      role: UserRole.CLUB,
      firstName: "Клуб",
      lastName: "Пример",
      country: "Россия",
      city: "Москва"
    },
    create: {
      email: "club@example.com",
      passwordHash,
      role: UserRole.CLUB,
      firstName: "Клуб",
      lastName: "Пример",
      country: "Россия",
      city: "Москва"
    }
  });

  const parentUser = await prisma.user.upsert({
    where: { email: "parent@example.com" },
    update: {
      passwordHash,
      role: UserRole.PARENT,
      firstName: "Ольга",
      lastName: "К.",
      country: "Россия",
      city: "Санкт-Петербург"
    },
    create: {
      email: "parent@example.com",
      passwordHash,
      role: UserRole.PARENT,
      firstName: "Ольга",
      lastName: "К.",
      country: "Россия",
      city: "Санкт-Петербург"
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      firstName: "Админ",
      lastName: "Системы",
      country: "Россия",
      city: "Москва"
    },
    create: {
      email: "admin@example.com",
      passwordHash,
      role: UserRole.ADMIN,
      firstName: "Админ",
      lastName: "Системы",
      country: "Россия",
      city: "Москва"
    }
  });

  const playerProfile = await prisma.player.upsert({
    where: { userId: playerUser.id },
    update: {
      firstName: "Алексей",
      lastName: "Кузнецов",
      dateOfBirth: new Date("2008-01-15"),
      nationality: "Россия",
      country: "Россия",
      city: "Санкт-Петербург",
      position: Position.C,
      isPublicInSearch: true,
      showContactsToScoutsOnly: true,
      contactEmail: "player@example.com",
      contactPhone: "+7 900 000 00 00",
      moderationStatus: ModerationStatus.APPROVED,
      isActive: true
    },
    create: {
      userId: playerUser.id,
      firstName: "Алексей",
      lastName: "Кузнецов",
      dateOfBirth: new Date("2008-01-15"),
      nationality: "Россия",
      country: "Россия",
      city: "Санкт-Петербург",
      position: Position.C,
      isPublicInSearch: true,
      showContactsToScoutsOnly: true,
      contactEmail: "player@example.com",
      contactPhone: "+7 900 000 00 00",
      moderationStatus: ModerationStatus.APPROVED,
      isActive: true
    }
  });

  const parentProfile = await prisma.parentProfile.upsert({
    where: { userId: parentUser.id },
    update: { contactInfo: "Мама игрока, готова к диалогу по карьерным вопросам" },
    create: {
      userId: parentUser.id,
      contactInfo: "Мама игрока, готова к диалогу по карьерным вопросам"
    }
  });

  await prisma.playerParent.upsert({
    where: { playerId_parentId: { playerId: playerProfile.id, parentId: parentProfile.id } },
    update: {},
    create: {
      playerId: playerProfile.id,
      parentId: parentProfile.id,
      relationType: "mother"
    }
  });

  await prisma.agentCard.upsert({
    where: { playerId: playerProfile.id },
    update: {
      cooperationUntil: "2026",
      potentialText: "Высокий потенциал, быстро обучается.",
      skillsText: "Скорость, дриблинг, завершение атак.",
      contractStatusText: "Контракт до 2025, возможен переход.",
      contactsText: "+7 900 000-00-00, agent@example.com",
      contactsVisibleAfterEngagement: true,
      contractVisibleAfterEngagement: true
    },
    create: {
      playerId: playerProfile.id,
      cooperationUntil: "2026",
      potentialText: "Высокий потенциал, быстро обучается.",
      skillsText: "Скорость, дриблинг, завершение атак.",
      contractStatusText: "Контракт до 2025, возможен переход.",
      contactsText: "+7 900 000-00-00, agent@example.com",
      contactsVisibleAfterEngagement: true,
      contractVisibleAfterEngagement: true
    }
  });

  const pendingScout = await prisma.engagementRequest.findFirst({
    where: {
      initiatorUserId: scoutUser.id,
      playerId: playerProfile.id,
      status: EngagementRequestStatus.PENDING
    }
  });
  if (!pendingScout) {
    await prisma.engagementRequest.create({
      data: {
        initiatorUserId: scoutUser.id,
        playerId: playerProfile.id,
        status: EngagementRequestStatus.PENDING,
        message: "Здравствуйте! Хотим обсудить сотрудничество."
      }
    });
  }

  const acceptedClub = await prisma.engagementRequest.findFirst({
    where: {
      initiatorUserId: clubUser.id,
      playerId: playerProfile.id,
      status: EngagementRequestStatus.ACCEPTED
    }
  });
  if (!acceptedClub) {
    await prisma.engagementRequest.create({
      data: {
        initiatorUserId: clubUser.id,
        playerId: playerProfile.id,
        status: EngagementRequestStatus.ACCEPTED,
        message: "Клуб интересуется игроком, готовы обсудить условия.",
        respondedAt: new Date()
      }
    });
  }

  await prisma.workingCard.upsert({
    where: { ownerUserId_playerId: { ownerUserId: clubUser.id, playerId: playerProfile.id } },
    update: {
      fullName: `${playerProfile.firstName} ${playerProfile.lastName}`,
      birthDate: playerProfile.dateOfBirth,
      cityText: playerProfile.city,
      positionText: playerProfile.position,
      cooperationUntil: "2026",
      potentialText: "Высокий потенциал, быстро обучается.",
      skillsText: "Скорость, дриблинг, завершение атак.",
      contractStatusText: "Контракт до 2025, возможен переход.",
      contactsText: "+7 900 000-00-00, agent@example.com",
      pipelineStatus: "Контакт установлен",
      tags: []
    },
    create: {
      ownerUserId: clubUser.id,
      playerId: playerProfile.id,
      source: WorkingCardSource.FROM_PROFILE,
      fullName: `${playerProfile.firstName} ${playerProfile.lastName}`,
      birthDate: playerProfile.dateOfBirth,
      cityText: playerProfile.city,
      positionText: playerProfile.position,
      cooperationUntil: "2026",
      potentialText: "Высокий потенциал, быстро обучается.",
      skillsText: "Скорость, дриблинг, завершение атак.",
      contractStatusText: "Контракт до 2025, возможен переход.",
      contactsText: "+7 900 000-00-00, agent@example.com",
      pipelineStatus: "Контакт установлен",
      tags: []
    }
  });

  const scoutShortlist = await prisma.shortlist.upsert({
    where: { id: "demo-shortlist-scout" },
    update: {},
    create: {
      id: "demo-shortlist-scout",
      ownerUserId: scoutUser.id,
      name: "Топ нападающие",
      description: "Список игроков для просмотра"
    }
  });

  await prisma.shortlistPlayer.upsert({
    where: { shortlistId_playerId: { shortlistId: scoutShortlist.id, playerId: playerProfile.id } },
    update: {
      rating: 7,
      tags: ["Скорость", "Интересен"],
      note: "Хорошая динамика, проверить весной."
    },
    create: {
      shortlistId: scoutShortlist.id,
      playerId: playerProfile.id,
      rating: 7,
      tags: ["Скорость", "Интересен"],
      note: "Хорошая динамика, проверить весной."
    }
  });

  const demoVacancy = await prisma.vacancy.upsert({
    where: { id: "demo-vacancy-1" },
    update: {},
    create: {
      id: "demo-vacancy-1",
      clubUserId: clubUser.id,
      title: "Просмотр игроков 2008–2010",
      type: VacancyType.VIEWING,
      positions: ["C", "LW"],
      ageFrom: 14,
      ageTo: 16,
      locationCountry: "Россия",
      locationCity: "Москва",
      description: "Приглашаем игроков на просмотр в академию.",
      requirements: "Опыт участия в турнирах, дисциплина.",
      conditions: "Питание предоставляется, проживание — по согласованию.",
      contactMode: "platform_only",
      status: VacancyStatus.PUBLISHED,
      publishedAt: new Date()
    }
  });

  await prisma.vacancyApplication.upsert({
    where: { vacancyId_playerId: { vacancyId: demoVacancy.id, playerId: playerProfile.id } },
    update: { status: VacancyApplicationStatus.SENT, messageFromPlayer: "Готов приехать на просмотр." },
    create: {
      vacancyId: demoVacancy.id,
      playerId: playerProfile.id,
      status: VacancyApplicationStatus.SENT,
      messageFromPlayer: "Готов приехать на просмотр."
    }
  });
}

async function run() {
  const prisma = new PrismaClient();
  try {
    await seedDemoUsers(prisma);
    // eslint-disable-next-line no-console
    console.log("Demo users ensured");
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  run().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Demo seed failed", err);
    process.exit(1);
  });
}
