/**
 * CLI для импорта справочников (лиги, клубы, сезоны) из JSON.
 * Формат JSON:
 * {
 *   "leagues": [{ "name": "КХЛ", "country": "Россия", "level": "pro" }],
 *   "clubs": [{ "name": "СКА", "country": "Россия", "city": "Санкт-Петербург", "leagueName": "КХЛ" }],
 *   "seasons": [{ "name": "2023/2024", "startYear": 2023, "endYear": 2024 }]
 * }
 *
 * Запуск: npm run import:refs --workspace api -- --file apps/api/scripts/sample-refs.json
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

type LeagueInput = { name: string; country?: string; level?: string };
type ClubInput = { name: string; country?: string; city?: string; leagueName?: string };
type SeasonInput = { name: string; startYear: number; endYear: number };
type InputFile = { leagues?: LeagueInput[]; clubs?: ClubInput[]; seasons?: SeasonInput[] };

const prisma = new PrismaClient();

function parseArgs() {
  const fileArg = process.argv.find((a) => a.startsWith("--file=")) || process.argv[process.argv.indexOf("--file") + 1];
  if (!fileArg) {
    console.error("Укажите путь к JSON: --file=apps/api/scripts/sample-refs.json");
    process.exit(1);
  }
  return resolve(process.cwd(), fileArg.replace("--file=", ""));
}

async function main() {
  const filePath = parseArgs();
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as InputFile;

  console.log("Импорт справочников из", filePath);

  const leagueMap = new Map<string, string>();

  // Лиги
  if (data.leagues?.length) {
    for (const lg of data.leagues) {
      const saved = await prisma.league.upsert({
        where: { name: lg.name },
        update: { country: lg.country, level: lg.level },
        create: { name: lg.name, country: lg.country ?? "N/A", level: lg.level ?? "n/a" }
      });
      leagueMap.set(lg.name, saved.id);
    }
    console.log(`Лиги: ${data.leagues.length} обработано`);
  }

  // Сезоны
  if (data.seasons?.length) {
    for (const s of data.seasons) {
      await prisma.season.upsert({
        where: { name: s.name },
        update: { startYear: s.startYear, endYear: s.endYear },
        create: { name: s.name, startYear: s.startYear, endYear: s.endYear }
      });
    }
    console.log(`Сезоны: ${data.seasons.length} обработано`);
  }

  // Клубы
  if (data.clubs?.length) {
    for (const c of data.clubs) {
      const leagueId = c.leagueName ? leagueMap.get(c.leagueName) ?? undefined : undefined;
      await prisma.club.upsert({
        where: { name: c.name },
        update: { country: c.country, city: c.city, leagueId },
        create: { name: c.name, country: c.country ?? "N/A", city: c.city ?? "", leagueId }
      });
    }
    console.log(`Клубы: ${data.clubs.length} обработано`);
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
