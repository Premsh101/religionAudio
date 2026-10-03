# Folklore & Legends Corpus

The fourth major story family after Ghost, Crime, Thriller, Children and Mythology.

This collection contains 36 story-level records from Indian, Bengali, English, Irish, Japanese, Russian, Chinese, West African and South African traditions (English sources), plus three Hindi/Urdu frame-tale and dastan records moved from the ghost corpus (सिंहासन बत्तीसी, فسانۂ عجائب, باغ و بہار).

## 2026-10 verification

Every Project Gutenberg record was checked against the source text and now carries explicit
`source.extract` start/end markers (see `../README.md`). Titles that did not exist in the cited book
were replaced by real tales of the same type from the same book:

| Old record | Finding | Now |
|---|---|---|
| The Boy Who Had Thirteen Mothers (PG 7128) | not in the book | `folklore-en-son-seven-queens` — The Son of Seven Queens |
| The Rajah's Son and the Crocodiles (PG 7128) | not in the book | `folklore-en-soothsayers-son` — The Soothsayer's Son |
| The Three Goats (PG 7128) | not in the book | `folklore-en-lambikin` — The Lambikin |
| Two Brothers (PG 29939) | exists, titled differently | `folklore-en-womens-words` — Women's Words Part Flesh and Blood |
| The Rooster, the Dog, and the Girl (PG 29939) | not in the book | `folklore-en-dog-cat-enemies` — Why Dog and Cat Are Enemies |
| The White-Nymph (PG 29939) | not in the book | `folklore-en-herd-boy-weaving-maiden` — The Herd Boy and the Weaving Maiden |
| The Tortoise and the Elephant (PG 66923) | not in West African Folk-Tales; "Elephant and Tortoise" is in South-African Folk-Tales | same id, re-sourced to PG 38339 |
| The Princess Labam | real heading | How the Raja's Son Won the Princess Labam |
| How Wisdom Became the Property of Man | real heading | How Wisdom Became the Property of the Human Race |

Every record targets Hindi + English + Arabic + Urdu.

## Meaning rule

Use one canonical source edition. Preserve events, characters, cultural practices, dialogue intent, sequence, uncertainty and outcomes. A faithful translation is not a summary or a modern adaptation.

## Rights

The Project Gutenberg source pages used for this wave identify the cited books as public-domain in the USA, but their notices instruct readers outside the USA to check local law. Exact scan/transcription/edition provenance is retained in the manifest. Modern translations must not be substituted without a separate licence.

## Regional sources

- Indian Fairy Tales — Project Gutenberg eBook #7128.
- Folk-Tales of Bengal — Project Gutenberg eBook #38488.
- English Fairy Tales — Project Gutenberg eBook #7439.
- Irish Fairy Tales — Project Gutenberg eBook #2892.
- Japanese Fairy Tales — Project Gutenberg eBook #4018.
- Russian Fairy Tales from the Skazki of Polevoi — Project Gutenberg eBook #34705.
- The Chinese Fairy Book — Project Gutenberg eBook #29939.
- West African Folk-Tales — Project Gutenberg eBook #66923.
- South-African Folk-Tales — Project Gutenberg eBook #38339.
- Urdu Wikisource — فسانۂ عجائب (فسانۂ سلطانِ یمن) and باغ و بہار (سیر پہلے درویش کی), fetched page by page.

## Commands

    python scripts/ingest/folklore_corpus.py --cache-dir /tmp/pgcache --dry-run
    python scripts/ingest/folklore_corpus.py
    python scripts/ingest/translate_folklore_corpus.py folklore-en-tom-tit-tot
    python scripts/ingest/verify_folklore_translations.py folklore-en-tom-tit-tot hi ar ur

Only publish after rights review, semantic QA and human editorial review.
