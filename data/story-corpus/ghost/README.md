# Ghost & Supernatural Story Corpus

This directory is the multilingual acquisition queue for ReligionAudio.

Languages: Hindi (hi), English (en), Arabic (ar), Urdu (ur).

## Rights-first workflow
1. Prefer public-domain works, traditional material, or explicit open licences.
2. Record the exact source edition/page and language.
3. Do not assume a modern translation is free because an underlying ancient story is public domain.
4. Keep Project Gutenberg notices/licence material with any imported Project Gutenberg electronic work where applicable.
5. For Wikisource, verify the exact edition/page before moving a record into the production database.

## Collection
English: The Canterville Ghost, The Monkey's Paw, The Red Room, The Signal-Man (extracted from Mugby Junction, PG 27924),
The Banshee (extracted from Stories by English Authors: Ireland, PG 6040), The Phantom 'Rickshaw (Kipling, PG 2806),
The Hungry Stones (Tagore, PG 2518).
Hindi: भूत (Premchand; text committed at `text/hi/ghost-hi-bhoot-premchand.txt`), वेताल पच्चीसी.
Arabic: حكاية التاجر مع العفريت, حكاية الصياد مع العفريت (Bulaq 1935 scan pages on ar.wikisource),
حكاية الوزير نور الدين مع شمس الدين أخيه (the Nur al-Din Ali / Badr al-Din Hasan tale; ألف ليلة وليلة/الجزء الثاني).

Changes in 2026-10: सिंहासन बत्तीसी, فسانۂ عجائب and باغ و بہار moved to the folklore manifest (they are
frame-tale/dastan collections, not ghost stories). داستان امیر حمزہ / طلسم ہوش ربا was removed: it merged two
very large works and cited no specific open edition.

`fullText`: `SOURCE_ONLY` = catalogued, no text yet; `PG_EXTRACT` = materialized from Project Gutenberg by the
manifest's `source.extract` markers; `TEXT_PRESENT` = source text committed (see `source.localPath`).
Every record carries `ageBand` and `contentNotes`; the Fisherman and Nur al-Din Nights tales and Premchand's भूत are adult-only (18+).
See `../README.md` for rights labels and marker conventions.

These records are intended to feed the existing Story/ContentItem pipeline and later multilingual TTS generation.
