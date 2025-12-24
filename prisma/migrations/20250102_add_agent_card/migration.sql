-- CreateTable
CREATE TABLE "AgentCard" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "cooperationUntil" TEXT,
    "potentialText" TEXT,
    "skillsText" TEXT,
    "contractStatusText" TEXT,
    "contactsText" TEXT,
    "contactsVisibleAfterEngagement" BOOLEAN NOT NULL DEFAULT false,
    "contractVisibleAfterEngagement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentCard_playerId_key" ON "AgentCard"("playerId");

-- AddForeignKey
ALTER TABLE "AgentCard" ADD CONSTRAINT "AgentCard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
