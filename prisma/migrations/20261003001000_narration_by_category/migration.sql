-- Give each imported collection the narration style of its genre. Only stories still on the old automatic
-- style are changed, so a style an editor picked by hand is kept.
UPDATE "Story" SET "narrationProfile"='SENSUAL' WHERE "collection"='adult' AND "narrationProfile"='DEFAULT';
UPDATE "Story" SET "narrationProfile"='ADVENTURE' WHERE "collection"='adventure' AND "narrationProfile" IN ('DEFAULT','FOLKLORE');
UPDATE "Story" SET "narrationProfile"='INSPIRATIONAL' WHERE "collection" IN ('biographies','inspirational') AND "narrationProfile"='DEFAULT';
UPDATE "Story" SET "narrationProfile"='DOCUMENTARY' WHERE "collection" IN ('historical','war-courage') AND "narrationProfile"='DEFAULT';
UPDATE "Story" SET "narrationProfile"='DEVOTIONAL' WHERE "collection" IN ('rituals','sacred-places') AND "narrationProfile"='DEFAULT';
UPDATE "Story" SET "narrationProfile"='ROMANCE' WHERE "collection"='romance' AND "narrationProfile" IN ('DEFAULT','FOLKLORE');
UPDATE "Story" SET "narrationProfile"='MYSTERY' WHERE "collection"='crime' AND "narrationProfile"='DEFAULT';
UPDATE "Story" SET "narrationProfile"='THRILLER' WHERE "collection"='thriller' AND "narrationProfile"='DEFAULT';
-- Narration queued but not yet started is redone in the new style.
DELETE FROM "AudioAsset" a USING "Story" s
WHERE a."storyId"=s."id" AND a."status"='QUEUED'
  AND NOT EXISTS (SELECT 1 FROM "AudioSegment" g WHERE g."audioAssetId"=a."id")
  AND upper(replace(coalesce(a."narrationProfile",''),'-','_'))<>s."narrationProfile"::text;
