# Crime / Detective Story Corpus

This collection is the source-of-truth catalog for crime, mystery, detective, theft, con-artist and thriller stories that can feed ReligionAudio / Sacred Stories as narrative content.

## Language requirement

Every record has four language targets:

- Hindi (hi)
- English (en)
- Arabic (ar)
- Urdu (ur)

The target language is not optional. A story is not considered multilingual-ready until all four versions are generated from the same canonical source edition and pass semantic QA.

## Meaning-preservation rule

Use **source-locked faithful translation**, not free adaptation.

The translation must preserve:

- every crime, clue, action and reveal;
- cause-and-effect relationships;
- character identity and relationships;
- places, dates, numbers and objects;
- dialogue intent and point of view;
- uncertainty, suspicion and evidence level;
- period-specific police, legal and social context.

Do not add modern detective explanations, remove uncomfortable facts, or turn a fictional allegation into a factual claim.

## Rights-first rule

We do not assume that a website hosting a scan owns the underlying copyright or that an old-looking scan is openly licensed. For every story:

1. record the exact edition/source URL;
2. verify the underlying work's copyright status in the intended distribution jurisdictions;
3. verify scan/transcription/translation rights separately;
4. ingest only when the rights status is compatible with the planned use.

Project Gutenberg pages used here identify the referenced editions as public-domain in the USA. Because the product is intended for wider distribution, the corpus keeps a jurisdiction-review flag rather than silently treating a USA status as global clearance.

## Initial collection

The first collection intentionally spans:

- American detective fiction: Poe's Dupin stories;
- British detective fiction: Sherlock Holmes;
- French crime fiction: Arsène Lupin;
- early Hindi jasoosi fiction: Gopal Ram Gahmari;
- early Urdu mystery fiction: Mirza Hadi Ruswa;
- Arabic crime/mystery storytelling: One Thousand and One Nights.

Academic/literary sources confirm that early Hindi and Urdu detective fiction formed substantial traditions of their own. Gopal Ram Gahmari is documented as a major early Hindi detective writer, while Urdu scholarship identifies early works and translations from the late nineteenth and early twentieth centuries.

## Ingestion

Use:

    python scripts/ingest/crime_corpus.py --cache-dir /tmp/pgcache --dry-run   # per-story word counts
    python scripts/ingest/crime_corpus.py

The ingestion script is deliberately rights-aware. It will not copy a source just because a URL works; the record must permit ingestion. Each Project Gutenberg record carries explicit `source.extract` start/end markers so only that story is materialized (see `../README.md`). Every record also has an `ageBand` and `contentNotes`; the Arabic Nights tales are adult-only.

## Translation

Once the canonical source file exists:

    python scripts/ingest/translate_crime_corpus.py crime-en-rue-morgue

Translate all missing targets from the same source text. The script uses an OpenAI-compatible endpoint configured with:

- AI_BASE_URL
- AI_API_KEY
- AI_TRANSLATION_MODEL (or AI_MODEL)

## QA

Run semantic checks after translation:

    python scripts/ingest/verify_crime_translations.py crime-en-rue-morgue hi ar ur

The QA checks omissions, additions, entities, numbers, causal meaning, dialogue intent, point of view and summary drift.

## Important product rule

Crime stories can contain murder, violence, threats or disturbing material. Store the source faithfully, but keep publication metadata that can support age/audience gating and content warnings. Do not sensationalize real-world victims or present fictional crime as verified history.
