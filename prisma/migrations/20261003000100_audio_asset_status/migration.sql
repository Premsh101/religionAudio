CREATE TYPE "AudioAssetStatus" AS ENUM ('QUEUED','PROCESSING','READY','FAILED');
ALTER TABLE "AudioAsset" ADD COLUMN "status" "AudioAssetStatus" NOT NULL DEFAULT 'QUEUED';
ALTER TABLE "AudioAsset" ADD COLUMN "totalSegments" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "AudioAsset_status_idx" ON "AudioAsset"("status");
