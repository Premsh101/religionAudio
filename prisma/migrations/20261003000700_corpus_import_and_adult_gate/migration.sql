-- Imported corpus stories (multilingual) and the 18+ age gate
ALTER TABLE "Story" ADD COLUMN "corpusId" TEXT;
ALTER TABLE "Story" ADD COLUMN "collection" TEXT;
ALTER TABLE "Story" ADD COLUMN "matureContent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Story" ADD COLUMN "translations" JSONB;
CREATE UNIQUE INDEX "Story_corpusId_key" ON "Story"("corpusId");
ALTER TABLE "User" ADD COLUMN "adultConsentAt" TIMESTAMP(3);
