-- Narration is now split into longer, paragraph-aligned parts and read a paragraph at a time.
-- Narrations not finished under the old method would mix old and new parts, so they are removed and
-- will be generated again on the next Play or from the Studio. Finished narrations are kept.
DELETE FROM "AudioAsset"
WHERE "status" IN ('QUEUED','PROCESSING','FAILED')
  AND ("storyId" IS NOT NULL OR "workId" IS NOT NULL);
