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
- Hindu / Indian epic tradition (Ganguli's Mahabharata: Adi Parva PG 7864; Vana Parva PG 11894 for Nala and Damayanti, PG 12333 for Savitri)
- Welsh mythology
- Finnish / Karelian mythology (John Martin Crawford's 1888 English Kalevala, PG 5186; PG 7000 is the Finnish original)

The two Jataka records moved to the children manifest as fables (Babbitt's Jataka Tales, 1912, ages 5-9).
The Bhagavad-Gita record stays here for now but is tagged `category: "SCRIPTURE"` with a `scriptureNote`:
it is living scripture and must be presented as such, not as mythology.

Every record has `source.extract` markers, so `mythology_corpus.py` materializes each story rather than
the whole book. See `../README.md`.

The corpus can later expand into Persian/Zoroastrian, Mesopotamian, Japanese, Chinese, African, Mesoamerican, Slavic and other traditions after exact open sources are verified.

## Rights

Project Gutenberg identifies the referenced editions as public domain in the USA. Wider commercial distribution needs jurisdiction review. A public-domain ancient work does not automatically make a modern translation, edition, scan or transcription free to redistribute.

## Commands

    python scripts/ingest/mythology_corpus.py
    python scripts/ingest/translate_mythology_corpus.py myth-en-prometheus-pandora
    python scripts/ingest/verify_mythology_translations.py myth-en-prometheus-pandora hi ar ur

Only publish after semantic QA and human editorial review.
