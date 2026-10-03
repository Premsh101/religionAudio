-- AlterTable
ALTER TABLE "AudioJob" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "AudioJob_status_priority_idx" ON "AudioJob"("status", "priority");
