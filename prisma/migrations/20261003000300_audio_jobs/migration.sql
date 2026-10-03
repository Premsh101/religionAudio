-- CreateEnum
CREATE TYPE "AudioJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- DropIndex
DROP INDEX "AudioAsset_status_idx";

-- DropIndex
DROP INDEX "Story_status_idx";

-- DropIndex
DROP INDEX "User_role_idx";

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "AudioJob" (
    "id" TEXT NOT NULL,
    "status" "AudioJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "audioAssetId" TEXT NOT NULL,
    "segmentSequence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AudioJob_status_nextRunAt_idx" ON "AudioJob"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "AudioJob_audioAssetId_status_idx" ON "AudioJob"("audioAssetId", "status");

-- CreateIndex
CREATE INDEX "Story_status_publishedAt_idx" ON "Story"("status", "publishedAt");

-- AddForeignKey
ALTER TABLE "AudioJob" ADD CONSTRAINT "AudioJob_audioAssetId_fkey" FOREIGN KEY ("audioAssetId") REFERENCES "AudioAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

