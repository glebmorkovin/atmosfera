/**
 * CLI для импорта игроков и статистики из JSON.
 * Формат файла:
 * [
 *   {
 *     "email": "player1@example.com",
 *     "password": "pass1234", // опционально, по умолчанию 12345678
 *     "firstName": "Иван",
 *     "lastName": "Иванов",
 *     "position": "C",
 *     "dateOfBirth": "2006-01-01",
 *     "country": "Россия",
 *     "city": "Москва",
 *     "heightCm": 182,
 *     "weightKg": 78,
 *     "currentClubName": "СКА",
 *     "currentLeagueName": "КХЛ",
 *     "stats": [
 *       {
 *         "seasonName": "2023/2024",
 *         "leagueName": "КХЛ",
 *         "teamName": "СКА",
 *         "gamesPlayed": 10,
 *         "goals": 5,
 *         "assists": 7,
 *         "points": 12
 *       }
 *     ]
 *   }
 * ]
 *
 * Запуск: npm run import:players --workspace api -- --file apps/api/scripts/sample-players.json
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

type StatInput = {
  seasonName: string;
  leagueName?: string;
  teamName?: string;
  gamesPlayed?: number;
  goals?: number;
  assists?: number;
  points?: number;
  pim?: number;
  plusMinus?: number;
};

type PlayerInput = {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  position: string;
  dateOfBirth: string;
  country: string;
  city: string;
  heightCm?: number;
  weightKg?: number;
  currentClubName?: string;
  currentLeagueName?: string;
  stats?: StatInput[];
};

const prisma = new PrismaClient();

function parseArgs() {
  const fileArg = process.argv.find((a) => a.startsWith("--file=")) || process.argv[process.argv.indexOf("--file") + 1];
  if (!fileArg) {
    console.error("Укажите путь к JSON: --file=apps/api/scripts/sample-players.json");
    process.exit(1);
  }
  return resolve(process.cwd(), fileArg.replace("--file=", ""));
}

async function main() {
  const filePath = parseArgs();
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as PlayerInput[];
  console.log("Импорт игроков из", filePath);

  for (const p of data) {
    // upsert user
    const hash = bcrypt.hashSync(p.password || "12345678", 10);
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { passwordHash: hash, role: UserRole.PLAYER },
      create: {
        email: p.email,
        passwordHash: hash,
        role: UserRole.PLAYER,
        firstName: p.firstName,
        lastName: p.lastName
      }
    });

    // resolve refs
    const league = p.currentLeagueName ? await prisma.league.findUnique({ where: { name: p.currentLeagueName } }) : null;
    const club = p.currentClubName ? await prisma.club.findUnique({ where: { name: p.currentClubName } }) : null;

    // upsert player profile
    const player = await prisma.player.upsert({
      where: { userId: user.id },
      update: {
        firstName: p.firstName,
        lastName: p.lastName,
        position: p.position as any,
        dateOfBirth: new Date(p.dateOfBirth),
        nationality: p.country,
        country: p.country,
        city: p.city,
        heightCm: p.heightCm,
        weightKg: p.weightKg,
        currentClubId: club?.id,
        currentLeagueId: league?.id,
        isPublicInSearch: true,
        showContactsToScoutsOnly: true
      },
      create: {
        userId: user.id,
        firstName: p.firstName,
        lastName: p.lastName,
        position: p.position as any,
        dateOfBirth: new Date(p.dateOfBirth),
        nationality: p.country,
        country: p.country,
        city: p.city,
        heightCm: p.heightCm,
        weightKg: p.weightKg,
        currentClubId: club?.id,
        currentLeagueId: league?.id
      }
    });

    // stats
    if (p.stats?.length) {
      for (const s of p.stats) {
        const season = await prisma.season.findUnique({ where: { name: s.seasonName } });
        const statLeague = s.leagueName ? await prisma.league.findUnique({ where: { name: s.leagueName } }) : null;
        const team = s.teamName ? await prisma.club.findUnique({ where: { name: s.teamName } }) : null;
        if (!season) {
          console.warn(`Пропуск статистики: сезон ${s.seasonName} не найден`);
          continue;
        }
        await prisma.playerStatLine.create({
          data: {
            playerId: player.id,
            seasonId: season.id,
            leagueId: statLeague?.id,
            teamId: team?.id,
            gamesPlayed: s.gamesPlayed,
            goals: s.goals,
            assists: s.assists,
            points: s.points,
            pim: s.pim,
            plusMinus: s.plusMinus
          }
        });
      }
    }

    console.log(`Импортирован игрок: ${p.firstName} ${p.lastName}`);
  }
  console.log("Готово");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
