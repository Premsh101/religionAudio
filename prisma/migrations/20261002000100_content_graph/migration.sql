-- Idempotent: the init migration was later expanded to include the content graph,
-- so on a fresh database these objects may already exist. Databases that applied
-- the original version of this migration are unaffected (applied migrations are not re-run).
CREATE TABLE IF NOT EXISTS "ContentItem" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "ContentType" NOT NULL,
  "audience" "Audience" NOT NULL,
  "ageMin" INTEGER,
  "ageMax" INTEGER,
  "language" TEXT NOT NULL,
  "summary" TEXT,
  "body" TEXT NOT NULL,
  "evidenceLens" "EvidenceLens",
  "rightsStatus" "RightsStatus" NOT NULL DEFAULT 'UNKNOWN',
  "workId" TEXT,
  "passageId" TEXT,
  "sourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContentItem_slug_key" ON "ContentItem"("slug");
CREATE INDEX IF NOT EXISTS "ContentItem_type_audience_idx" ON "ContentItem"("type","audience");

CREATE TABLE IF NOT EXISTS "PlaceOnContent" (
  "placeId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  CONSTRAINT "PlaceOnContent_pkey" PRIMARY KEY ("placeId","contentId")
);

ALTER TABLE "Place" ADD COLUMN IF NOT EXISTS "traditionId" TEXT;
ALTER TABLE "AudioAsset" ADD COLUMN IF NOT EXISTS "contentId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContentItem_workId_fkey') THEN
    ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContentItem_passageId_fkey') THEN
    ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContentItem_sourceId_fkey') THEN
    ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlaceOnContent_placeId_fkey') THEN
    ALTER TABLE "PlaceOnContent" ADD CONSTRAINT "PlaceOnContent_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlaceOnContent_contentId_fkey') THEN
    ALTER TABLE "PlaceOnContent" ADD CONSTRAINT "PlaceOnContent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Place_traditionId_fkey') THEN
    ALTER TABLE "Place" ADD CONSTRAINT "Place_traditionId_fkey" FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AudioAsset_contentId_fkey') THEN
    ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Place_country_region_idx" ON "Place"("country","region");
