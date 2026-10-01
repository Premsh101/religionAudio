CREATE TABLE "ContentItem" (
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
CREATE UNIQUE INDEX "ContentItem_slug_key" ON "ContentItem"("slug");
CREATE INDEX "ContentItem_type_audience_idx" ON "ContentItem"("type","audience");
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PlaceOnContent" (
  "placeId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  CONSTRAINT "PlaceOnContent_pkey" PRIMARY KEY ("placeId","contentId")
);
ALTER TABLE "PlaceOnContent" ADD CONSTRAINT "PlaceOnContent_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaceOnContent" ADD CONSTRAINT "PlaceOnContent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Place" ADD COLUMN "traditionId" TEXT;
ALTER TABLE "Place" ADD CONSTRAINT "Place_traditionId_fkey" FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AudioAsset" ADD COLUMN "contentId" TEXT;
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Place_country_region_idx" ON "Place"("country","region");
