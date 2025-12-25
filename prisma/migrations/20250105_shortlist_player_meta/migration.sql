-- AlterTable
ALTER TABLE "ShortlistPlayer" ADD COLUMN "rating" INTEGER;
ALTER TABLE "ShortlistPlayer" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ShortlistPlayer" ADD COLUMN "note" TEXT;
