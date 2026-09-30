CREATE TYPE "UserRole" AS ENUM ('USER','EDITOR','ADMIN');
CREATE TYPE "StoryStatus" AS ENUM ('DRAFT','REVIEW','PUBLISHED','ARCHIVED');

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "Story" ADD COLUMN "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Story" ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Story_status_idx" ON "Story"("status");
