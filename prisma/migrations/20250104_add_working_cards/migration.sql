-- CreateEnum
CREATE TYPE "WorkingCardSource" AS ENUM ('FROM_PROFILE', 'MANUAL');

-- CreateTable
CREATE TABLE "WorkingCard" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "source" "WorkingCardSource" NOT NULL DEFAULT 'FROM_PROFILE',
    "fullName" TEXT,
    "birthDate" TIMESTAMP(3),
    "cityText" TEXT,
    "positionText" TEXT,
    "cooperationUntil" TEXT,
    "potentialText" TEXT,
    "skillsText" TEXT,
    "contractStatusText" TEXT,
    "contactsText" TEXT,
    "clubText" TEXT,
    "pipelineStatus" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkingCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkingCard_ownerUserId_playerId_key" ON "WorkingCard"("ownerUserId", "playerId");

-- CreateIndex
CREATE INDEX "WorkingCard_ownerUserId_idx" ON "WorkingCard"("ownerUserId");

-- CreateIndex
CREATE INDEX "WorkingCard_playerId_idx" ON "WorkingCard"("playerId");

-- CreateIndex
CREATE INDEX "WorkingCard_archivedAt_idx" ON "WorkingCard"("archivedAt");

-- AddForeignKey
ALTER TABLE "WorkingCard" ADD CONSTRAINT "WorkingCard_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingCard" ADD CONSTRAINT "WorkingCard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
