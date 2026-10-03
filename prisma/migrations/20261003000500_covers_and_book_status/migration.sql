-- Book approval (existing books stay published) and generated cover art for books and stories
ALTER TABLE "Work" ADD COLUMN "status" "StoryStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Work" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "Work" ADD COLUMN "summary" TEXT;
ALTER TABLE "Work" ADD COLUMN "coverImageKey" TEXT;
ALTER TABLE "Work" ADD COLUMN "coverPrompt" TEXT;
ALTER TABLE "Work" ADD COLUMN "coverUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Story" ADD COLUMN "coverImageKey" TEXT;
ALTER TABLE "Story" ADD COLUMN "coverPrompt" TEXT;
ALTER TABLE "Story" ADD COLUMN "coverUpdatedAt" TIMESTAMP(3);
