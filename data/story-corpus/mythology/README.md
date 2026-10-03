# Mythology Corpus

This is the first world-mythology collection for ReligionAudio / Sacred Stories.

Every story targets Hindi, English, Arabic and Urdu. The same canonical source edition feeds all translations.

## Meaning preservation

Preserve the complete narrative:
- every event and relationship;
- names, genealogies and places;
- divine beings and culturally specific concepts;
- dialogue, uncertainty and point of view;
- sequence of revelations and outcomes.

Do not summarize, sanitize, modernize into a different worldview, or translate a secondary summary.

## Tradition and evidence

Mythology is presented as mythology, sacred tradition or literary retelling. The platform must not silently present mythic events as scientifically verified historical facts.

Where a nineteenth- or early-twentieth-century English retelling is the open source, label it as a **literary source edition** rather than pretending it is the original ancient-language text.

## Initial coverage

The first wave covers:
- Greek / Roman mythology
- Norse mythology
- Ancient Egyptian mythology
- Hindu / Indian epic tradition
- Buddhist Jataka tradition
- Welsh mythology
- Finnish / Karelian mythology

The corpus can later expand into Persian/Zoroastrian, Mesopotamian, Japanese, Chinese, African, Mesoamerican, Slavic and other traditions after exact open sources are verified.

## Rights

Project Gutenberg identifies the referenced editions as public domain in the USA. Wider commercial distribution needs jurisdiction review. A public-domain ancient work does not automatically make a modern translation, edition, scan or transcription free to redistribute.

## Commands

    python scripts/ingest/mythology_corpus.py
    python scripts/ingest/translate_mythology_corpus.py myth-en-prometheus-pandora
    python scripts/ingest/verify_mythology_translations.py myth-en-prometheus-pandora hi ar ur

Only publish after semantic QA and human editorial review.
