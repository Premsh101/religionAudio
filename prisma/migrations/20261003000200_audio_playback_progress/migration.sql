CREATE TABLE "AudioPlaybackProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "audioAssetId" TEXT NOT NULL,
  "currentSequence" INTEGER NOT NULL DEFAULT 1,
  "positionMs" INTEGER NOT NULL DEFAULT 0,
  "progressPercent" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AudioPlaybackProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AudioPlaybackProgress_userId_audioAssetId_key"
  ON "AudioPlaybackProgress"("userId", "audioAssetId");
CREATE INDEX "AudioPlaybackProgress_userId_updatedAt_idx"
  ON "AudioPlaybackProgress"("userId", "updatedAt");
CREATE INDEX "AudioPlaybackProgress_audioAssetId_idx"
  ON "AudioPlaybackProgress"("audioAssetId");

ALTER TABLE "AudioPlaybackProgress"
  ADD CONSTRAINT "AudioPlaybackProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AudioPlaybackProgress"
  ADD CONSTRAINT "AudioPlaybackProgress_audioAssetId_fkey"
  FOREIGN KEY ("audioAssetId") REFERENCES "AudioAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
