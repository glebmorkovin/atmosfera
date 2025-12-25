-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('DRAFT', 'PENDING_MODERATION', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VacancyType" AS ENUM ('TRYOUT', 'CONTRACT', 'ACADEMY', 'VIEWING', 'OTHER');

-- CreateEnum
CREATE TYPE "VacancyApplicationStatus" AS ENUM ('SENT', 'VIEWED', 'SHORTLISTED', 'INVITED', 'REJECTED', 'WITHDRAWN', 'ACCEPTED');

-- CreateTable
CREATE TABLE "Vacancy" (
    "id" TEXT NOT NULL,
    "clubUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "VacancyType" NOT NULL DEFAULT 'OTHER',
    "positions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ageFrom" INTEGER,
    "ageTo" INTEGER,
    "locationCountry" TEXT,
    "locationCity" TEXT,
    "leagueId" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "conditions" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "contactMode" TEXT,
    "status" "VacancyStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacancyApplication" (
    "id" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "VacancyApplicationStatus" NOT NULL DEFAULT 'SENT',
    "messageFromPlayer" TEXT,
    "messageFromClub" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VacancyApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vacancy_clubUserId_idx" ON "Vacancy"("clubUserId");

-- CreateIndex
CREATE INDEX "Vacancy_status_idx" ON "Vacancy"("status");

-- CreateIndex
CREATE INDEX "Vacancy_publishedAt_idx" ON "Vacancy"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VacancyApplication_vacancyId_playerId_key" ON "VacancyApplication"("vacancyId", "playerId");

-- CreateIndex
CREATE INDEX "VacancyApplication_vacancyId_idx" ON "VacancyApplication"("vacancyId");

-- CreateIndex
CREATE INDEX "VacancyApplication_playerId_idx" ON "VacancyApplication"("playerId");

-- CreateIndex
CREATE INDEX "VacancyApplication_status_idx" ON "VacancyApplication"("status");

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_clubUserId_fkey" FOREIGN KEY ("clubUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyApplication" ADD CONSTRAINT "VacancyApplication_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyApplication" ADD CONSTRAINT "VacancyApplication_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
