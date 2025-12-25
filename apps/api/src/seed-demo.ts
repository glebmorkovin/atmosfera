import { EngagementRequestStatus, PrismaClient, ModerationStatus, Position, UserRole, WorkingCardSource } from "@prisma/client";
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
