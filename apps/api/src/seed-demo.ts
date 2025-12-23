import { PrismaClient, ModerationStatus, Position, UserRole } from "@prisma/client";
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

  await prisma.user.upsert({
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

  await prisma.player.upsert({
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
