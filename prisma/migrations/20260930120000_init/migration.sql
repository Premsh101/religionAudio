-- ReligionAudio initial PostgreSQL schema
-- Generated from prisma/schema.prisma (Prisma 7).
-- Review the target database before applying to a non-empty environment.

CREATE TYPE "ContentType" AS ENUM (
  'SCRIPTURE','TRANSLATION','COMMENTARY','STORY','MYTHOLOGY','FOLKLORE',
  'GHOST_STORY','MORAL_TALE','BIOGRAPHY','FESTIVAL','RITUAL',
  'HISTORICAL_ACCOUNT','SACRED_PLACE'
);

CREATE TYPE "Audience" AS ENUM ('KIDS','FAMILY','TEENS','ADULTS','RESEARCH');

CREATE TYPE "EvidenceLens" AS ENUM ('TEXT','TRADITION','SCHOLARSHIP','SCIENCE');

CREATE TYPE "RightsStatus" AS ENUM (
  'UNKNOWN','RESEARCH_ONLY','PERMISSION_REQUIRED','COMMERCIAL_CLEARED'
);

CREATE TYPE "NarrationProfile" AS ENUM (
  'DEFAULT','SCRIPTURE','MYTHOLOGY','FOLKLORE','GHOST','KIDS','MORAL_TALE'
);

CREATE TYPE "StoryIntensity" AS ENUM ('GENTLE','ADVENTUROUS','SPOOKY','DARK');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "displayName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Religion" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Religion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tradition" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "religionId" TEXT NOT NULL,
  CONSTRAINT "Tradition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Source" (
  "id" TEXT NOT NULL,
  "externalId" TEXT,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "license" TEXT,
  "rightsStatus" "RightsStatus" NOT NULL DEFAULT 'UNKNOWN',
  "commercialUse" BOOLEAN NOT NULL DEFAULT false,
  "attribution" TEXT,
  "notes" TEXT,
  "verifiedAt" TIMESTAMP(3),
  CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Work" (
  "id" TEXT NOT NULL,
  "externalId" TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "originalLanguage" TEXT,
  "edition" TEXT,
  "translator" TEXT,
  "rightsStatus" "RightsStatus" NOT NULL DEFAULT 'UNKNOWN',
  "religionId" TEXT,
  "traditionId" TEXT,
  "sourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Passage" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "originalText" TEXT,
  "language" TEXT NOT NULL,
  "workId" TEXT NOT NULL,
  "sourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "Story" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "ContentType" NOT NULL,
  "audience" "Audience" NOT NULL,
  "ageMin" INTEGER,
  "ageMax" INTEGER,
  "language" TEXT NOT NULL DEFAULT 'en',
  "summary" TEXT,
  "body" TEXT NOT NULL,
  "traditionId" TEXT,
  "religionId" TEXT,
  "sourceId" TEXT,
  "intensity" "StoryIntensity" NOT NULL DEFAULT 'GENTLE',
  "narrationProfile" "NarrationProfile" NOT NULL DEFAULT 'DEFAULT',
  "contentWarnings" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Place" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "region" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "placeType" TEXT,
  "traditionalSignificance" TEXT,
  "historicalSignificance" TEXT,
  "archaeologicalEvidence" TEXT,
  "uncertaintyNotes" TEXT,
  "sourceId" TEXT,
  "traditionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaceOnContent" (
  "placeId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  CONSTRAINT "PlaceOnContent_pkey" PRIMARY KEY ("placeId","contentId")
);

CREATE TABLE "PlaceOnStory" (
  "placeId" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  CONSTRAINT "PlaceOnStory_pkey" PRIMARY KEY ("placeId","storyId")
);

CREATE TABLE "AudioAsset" (
  "id" TEXT NOT NULL,
  "title" TEXT,
  "language" TEXT NOT NULL,
  "voiceId" TEXT,
  "narrationProfile" TEXT,
  "engine" TEXT,
  "storageKey" TEXT NOT NULL,
  "durationMs" INTEGER,
  "rightsStatus" "RightsStatus" NOT NULL DEFAULT 'UNKNOWN',
  "sourceId" TEXT,
  "workId" TEXT,
  "contentId" TEXT,
  "storyId" TEXT,
  "placeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AudioAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoryScene" (
  "id" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "title" TEXT,
  "text" TEXT NOT NULL,
  "mood" TEXT,
  "narrationProfile" "NarrationProfile",
  "storyId" TEXT NOT NULL,
  CONSTRAINT "StoryScene_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AudioSegment" (
  "id" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "startMs" INTEGER NOT NULL,
  "endMs" INTEGER NOT NULL,
  "storageKey" TEXT,
  "transcript" TEXT,
  "passageId" TEXT,
  "storySceneId" TEXT,
  "audioAssetId" TEXT NOT NULL,
  CONSTRAINT "AudioSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AICitation" (
  "id" TEXT NOT NULL,
  "lens" "EvidenceLens" NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "quote" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AICitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "Religion_name_key" ON "Religion"("name");
CREATE UNIQUE INDEX "Religion_slug_key" ON "Religion"("slug");
CREATE UNIQUE INDEX "Tradition_religionId_slug_key" ON "Tradition"("religionId","slug");
CREATE UNIQUE INDEX "Source_externalId_key" ON "Source"("externalId");
CREATE UNIQUE INDEX "Work_externalId_key" ON "Work"("externalId");
CREATE UNIQUE INDEX "Work_slug_key" ON "Work"("slug");
CREATE UNIQUE INDEX "Passage_workId_reference_key" ON "Passage"("workId","reference");
CREATE UNIQUE INDEX "ContentItem_slug_key" ON "ContentItem"("slug");
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");
CREATE UNIQUE INDEX "StoryScene_storyId_sequence_key" ON "StoryScene"("storyId","sequence");
CREATE UNIQUE INDEX "AudioSegment_audioAssetId_sequence_key" ON "AudioSegment"("audioAssetId","sequence");

CREATE INDEX "Passage_workId_sequence_idx" ON "Passage"("workId","sequence");
CREATE INDEX "ContentItem_type_audience_idx" ON "ContentItem"("type","audience");
CREATE INDEX "Story_type_audience_idx" ON "Story"("type","audience");
CREATE INDEX "Place_country_region_idx" ON "Place"("country","region");
CREATE INDEX "AudioAsset_language_narrationProfile_idx" ON "AudioAsset"("language","narrationProfile");
CREATE INDEX "AudioSegment_storySceneId_idx" ON "AudioSegment"("storySceneId");

ALTER TABLE "Tradition" ADD CONSTRAINT "Tradition_religionId_fkey"
  FOREIGN KEY ("religionId") REFERENCES "Religion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Work" ADD CONSTRAINT "Work_religionId_fkey"
  FOREIGN KEY ("religionId") REFERENCES "Religion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Work" ADD CONSTRAINT "Work_traditionId_fkey"
  FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Work" ADD CONSTRAINT "Work_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Passage" ADD CONSTRAINT "Passage_workId_fkey"
  FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_workId_fkey"
  FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_passageId_fkey"
  FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Story" ADD CONSTRAINT "Story_traditionId_fkey"
  FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Story" ADD CONSTRAINT "Story_religionId_fkey"
  FOREIGN KEY ("religionId") REFERENCES "Religion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Story" ADD CONSTRAINT "Story_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Place" ADD CONSTRAINT "Place_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Place" ADD CONSTRAINT "Place_traditionId_fkey"
  FOREIGN KEY ("traditionId") REFERENCES "Tradition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlaceOnContent" ADD CONSTRAINT "PlaceOnContent_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaceOnContent" ADD CONSTRAINT "PlaceOnContent_contentId_fkey"
  FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlaceOnStory" ADD CONSTRAINT "PlaceOnStory_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaceOnStory" ADD CONSTRAINT "PlaceOnStory_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_workId_fkey"
  FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_contentId_fkey"
  FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StoryScene" ADD CONSTRAINT "StoryScene_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AudioSegment" ADD CONSTRAINT "AudioSegment_passageId_fkey"
  FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AudioSegment" ADD CONSTRAINT "AudioSegment_storySceneId_fkey"
  FOREIGN KEY ("storySceneId") REFERENCES "StoryScene"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AudioSegment" ADD CONSTRAINT "AudioSegment_audioAssetId_fkey"
  FOREIGN KEY ("audioAssetId") REFERENCES "AudioAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","logs","rolled_back_at","started_at","applied_steps_count")
VALUES (gen_random_uuid()::text, '', NOW(), '20260930120000_init', NULL, NULL, NOW(), 1);
