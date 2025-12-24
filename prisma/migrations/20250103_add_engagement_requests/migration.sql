-- CreateEnum
CREATE TYPE "EngagementRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "EngagementRequest" (
    "id" TEXT NOT NULL,
    "initiatorUserId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "message" TEXT,
    "status" "EngagementRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "EngagementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EngagementRequest_playerId_idx" ON "EngagementRequest"("playerId");

-- CreateIndex
CREATE INDEX "EngagementRequest_initiatorUserId_idx" ON "EngagementRequest"("initiatorUserId");

-- CreateIndex
CREATE INDEX "EngagementRequest_status_idx" ON "EngagementRequest"("status");

-- Ensure single pending request per initiator/player pair
CREATE UNIQUE INDEX "EngagementRequest_pending_unique" ON "EngagementRequest"("initiatorUserId", "playerId") WHERE status = 'PENDING';

-- AddForeignKey
ALTER TABLE "EngagementRequest" ADD CONSTRAINT "EngagementRequest_initiatorUserId_fkey" FOREIGN KEY ("initiatorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementRequest" ADD CONSTRAINT "EngagementRequest_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
