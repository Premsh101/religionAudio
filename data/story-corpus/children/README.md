# Children / Family Story Corpus

Every record targets Hindi, English, Arabic and Urdu.

## Meaning preservation
Translations are source-locked and complete. Preserve all events, characters, relationships, dialogue intent, setting, numbers, cultural details, point of view and story lessons. Never replace the complete story with a summary or an easier retelling while labeling it a translation.

## Child-safety metadata
Age bands are catalog guidance, not medical or developmental claims. Traditional fairy tales may contain material unsuitable for younger children, so publication should support story-level audience filtering and content warnings.

## Rights
Project Gutenberg currently lists the referenced classic editions as public domain in the USA. Peter Pan has additional jurisdiction-specific history, so it stays under legal review. Hindi Wikisource and Arabic Wikisource sources are treated edition-by-edition; a public-domain underlying story does not automatically clear a modern transcription, translation or edited edition.

## Source diversity
The collection spans British/American children's classics, German fairy tales, Indian Hindi literature, Arabic adventure and animal-fable traditions, and cross-cultural fable literature.

## Commands
    python scripts/ingest/children_corpus.py
    python scripts/ingest/translate_children_corpus.py children-en-alice
    python scripts/ingest/verify_children_translations.py children-en-alice hi ar ur

Do not publish a translation until semantic QA and human editorial review pass.
