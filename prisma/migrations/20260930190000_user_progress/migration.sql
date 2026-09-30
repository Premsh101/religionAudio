CREATE TABLE "WorkProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workId" TEXT NOT NULL,
  "currentSequence" INTEGER NOT NULL DEFAULT 1,
  "progressPercent" INTEGER NOT NULL DEFAULT 0,
  "positionMs" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoryProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "currentScene" INTEGER NOT NULL DEFAULT 1,
  "progressPercent" INTEGER NOT NULL DEFAULT 0,
  "positionMs" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Bookmark" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workId" TEXT,
  "passageId" TEXT,
  "storyId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkProgress_userId_workId_key" ON "WorkProgress"("userId","workId");
CREATE INDEX "WorkProgress_userId_updatedAt_idx" ON "WorkProgress"("userId","updatedAt");

CREATE UNIQUE INDEX "StoryProgress_userId_storyId_key" ON "StoryProgress"("userId","storyId");
CREATE INDEX "StoryProgress_userId_updatedAt_idx" ON "StoryProgress"("userId","updatedAt");

CREATE INDEX "Bookmark_userId_createdAt_idx" ON "Bookmark"("userId","createdAt");
CREATE INDEX "Bookmark_workId_idx" ON "Bookmark"("workId");
CREATE INDEX "Bookmark_passageId_idx" ON "Bookmark"("passageId");
CREATE INDEX "Bookmark_storyId_idx" ON "Bookmark"("storyId");

ALTER TABLE "WorkProgress" ADD CONSTRAINT "WorkProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkProgress" ADD CONSTRAINT "WorkProgress_workId_fkey"
  FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StoryProgress" ADD CONSTRAINT "StoryProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryProgress" ADD CONSTRAINT "StoryProgress_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_workId_fkey"
  FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_passageId_fkey"
  FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
