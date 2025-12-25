import {
  EngagementRequestStatus,
  PrismaClient,
  UserRole,
  Position,
  ModerationStatus,
  MediaStatus,
  NotificationType,
  WorkingCardSource,
  VacancyStatus,
  VacancyType,
  VacancyApplicationStatus
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // Reference data
  const [leagueMhl, leagueNmhl, leagueYhl] = await Promise.all([
    prisma.league.upsert({
      where: { name: "МХЛ" },
      update: {},
      create: { name: "МХЛ", country: "Россия", level: "U20" }
    }),
    prisma.league.upsert({
      where: { name: "НМХЛ" },
      update: {},
      create: { name: "НМХЛ", country: "Россия", level: "U20" }
    }),
    prisma.league.upsert({
      where: { name: "ЮХЛ" },
      update: {},
      create: { name: "ЮХЛ", country: "Россия", level: "U18" }
    })
  ]);

  const [clubSka1946, clubRedArmy, clubWhiteBears] = await Promise.all([
    prisma.club.upsert({
      where: { name: "СКА-1946" },
      update: {},
      create: { name: "СКА-1946", country: "Россия", city: "Санкт-Петербург", leagueId: leagueMhl.id }
    }),
    prisma.club.upsert({
      where: { name: "Красная Армия" },
      update: {},
      create: { name: "Красная Армия", country: "Россия", city: "Москва", leagueId: leagueNmhl.id }
    }),
    prisma.club.upsert({
      where: { name: "Белые Медведи U18" },
      update: {},
      create: { name: "Белые Медведи U18", country: "Россия", city: "Челябинск", leagueId: leagueYhl.id }
    })
  ]);

  const [season2324, season2223] = await Promise.all([
    prisma.season.upsert({
      where: { name: "23/24" },
      update: {},
      create: { name: "23/24", startYear: 2023, endYear: 2024 }
    }),
    prisma.season.upsert({
      where: { name: "22/23" },
      update: {},
      create: { name: "22/23", startYear: 2022, endYear: 2023 }
    })
  ]);

  // Users
  const playerUser = await prisma.user.upsert({
    where: { email: "player@example.com" },
    update: {},
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

  const parentUser = await prisma.user.upsert({
    where: { email: "parent@example.com" },
    update: {},
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

  const scoutUser = await prisma.user.upsert({
    where: { email: "scout@example.com" },
    update: {},
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
    update: {},
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

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
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

  // Player profile
  const playerProfile = await prisma.player.upsert({
    where: { userId: playerUser.id },
    update: {},
    create: {
      userId: playerUser.id,
      firstName: "Алексей",
      lastName: "Кузнецов",
      dateOfBirth: new Date("2007-04-12"),
      nationality: "Россия",
      country: "Россия",
      city: "Санкт-Петербург",
      heightCm: 183,
      weightKg: 78,
      shoots: "left",
      position: Position.C,
      currentClubId: clubSka1946.id,
      currentLeagueId: leagueMhl.id,
      jerseyNumber: 27,
      bioText: "Центр с сильной скоростью и PK, играет в звене спецбригад.",
      isPublicInSearch: true,
      showContactsToScoutsOnly: true,
      contactEmail: "player@example.com",
      contactPhone: "+7 900 000 00 00",
      moderationStatus: ModerationStatus.APPROVED
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

  // Parent profile + link to player
  const parentProfile = await prisma.parentProfile.upsert({
    where: { userId: parentUser.id },
    update: {},
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
      clubText: clubSka1946.name,
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
      clubText: clubSka1946.name,
      pipelineStatus: "Контакт установлен",
      tags: []
    }
  });

  // Stats
  await prisma.playerStatLine.createMany({
    data: [
      {
        playerId: playerProfile.id,
        seasonId: season2324.id,
        teamId: clubSka1946.id,
        leagueId: leagueMhl.id,
        gamesPlayed: 38,
        goals: 12,
        assists: 18,
        points: 30,
        pim: 24,
        plusMinus: 9
      },
      {
        playerId: playerProfile.id,
        seasonId: season2223.id,
        teamId: clubSka1946.id,
        leagueId: leagueNmhl.id,
        gamesPlayed: 42,
        goals: 10,
        assists: 21,
        points: 31,
        pim: 36,
        plusMinus: 7
      }
    ]
  });

  // Media
  const mainPhoto = await prisma.media.create({
    data: {
      playerId: playerProfile.id,
      ownerUserId: playerUser.id,
      mediaType: "image",
      urlOrPath: "https://example.com/photos/player-main.jpg",
      title: "Профильное фото",
      isProfileMain: true,
      status: MediaStatus.APPROVED
    }
  });

  await prisma.media.create({
    data: {
      playerId: playerProfile.id,
      ownerUserId: playerUser.id,
      mediaType: "video",
      urlOrPath: "https://youtu.be/demo-highlight",
      title: "Хайлайты 23/24",
      description: "Лучшие моменты сезона",
      status: MediaStatus.APPROVED
    }
  });

  await prisma.player.update({
    where: { id: playerProfile.id },
    data: { mainPhotoId: mainPhoto.id }
  });

  // Shortlists & saved filters
  const shortlist = await prisma.shortlist.upsert({
    where: { id: "demo-shortlist-1" },
    update: {},
    create: {
      id: "demo-shortlist-1",
      ownerUserId: scoutUser.id,
      name: "Центры МХЛ",
      description: "Нужен скоростной центр с хорошим PK"
    }
  });

  await prisma.shortlistPlayer.upsert({
    where: { shortlistId_playerId: { shortlistId: shortlist.id, playerId: playerProfile.id } },
    update: {
      rating: 8,
      tags: ["Просмотрен", "Интересен"],
      note: "Рекомендуется для просмотра в январе."
    },
    create: {
      shortlistId: shortlist.id,
      playerId: playerProfile.id,
      rating: 8,
      tags: ["Просмотрен", "Интересен"],
      note: "Рекомендуется для просмотра в январе."
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

  await prisma.vacancy.upsert({
    where: { id: "demo-vacancy-2" },
    update: {},
    create: {
      id: "demo-vacancy-2",
      clubUserId: clubUser.id,
      title: "Набор игроков 2009–2011",
      type: VacancyType.ACADEMY,
      positions: ["D", "G"],
      ageFrom: 13,
      ageTo: 15,
      locationCountry: "Россия",
      locationCity: "Ярославль",
      description: "Идёт набор в молодежную академию клуба.",
      requirements: "Опыт участия в первенствах, дисциплина.",
      conditions: "Проживание и питание предоставляются.",
      contactMode: "platform_only",
      status: VacancyStatus.PENDING_MODERATION
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

  await prisma.savedSearchFilter.upsert({
    where: { id: "demo-filter-1" },
    update: {},
    create: {
      id: "demo-filter-1",
      ownerUserId: scoutUser.id,
      name: "Защитники 2006-2007",
      config: {
        position: "D",
        minBirthYear: 2006,
        maxBirthYear: 2007,
        league: "НМХЛ"
      }
    }
  });

  // Notifications and views
  await prisma.profileViewEvent.createMany({
    data: [
      { playerId: playerProfile.id, viewerUserId: scoutUser.id, viewedAt: new Date() },
      { playerId: playerProfile.id, viewerUserId: scoutUser.id, viewedAt: new Date(Date.now() - 86400000) }
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: playerUser.id,
        type: NotificationType.PROFILE_VIEW,
        title: "Ваш профиль посмотрели",
        body: "Новый просмотр от скаута",
        payload: { viewer: "scout@example.com" }
      },
      {
        userId: playerUser.id,
        type: NotificationType.SHORTLIST_ADD,
        title: "Добавление в шортлист",
        body: "Ваш профиль добавлен в список «Центры МХЛ»",
        payload: { shortlistId: shortlist.id }
      }
    ]
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: scoutUser.id,
      action: "shortlist.add_player",
      entityType: "ShortlistPlayer",
      entityId: `${shortlist.id}:${playerProfile.id}`,
      payload: { shortlistId: shortlist.id, playerId: playerProfile.id }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
