# Moral Tales & Fables Corpus

This collection provides short, repeatable wisdom stories distinct from the broader Children, Folklore and Mythology collections.

The first wave contains 40 story-level records:
- 12 Hitopadesha / Book of Good Counsels stories
- 12 Jataka stories
- 8 Oriental moral tales
- 8 stories from The Thousand and One Days

The sources cover Indian/Buddhist, South Asian, Arabic/Persian-influenced and broader Eastern storytelling traditions. Project Gutenberg lists the cited source editions as public domain in the USA. The Hindu literature source includes the Book of Good Counsels and explicitly identifies it as selected from the Sanskrit Hitopadesha; its Gutenberg text also warns non-US users to check local law. citeturn863348view1turn202287search0turn407385search0turn311879view0

## Four-language rule

Every story targets:
- Hindi
- English
- Arabic
- Urdu

The same canonical source edition feeds every language. When an open source is a historical English translation of Sanskrit or another tradition, the metadata records the original-language lineage so we do not misrepresent the provenance.

## Meaning preservation

Preserve:
- all events and causal relationships;
- characters and relationships;
- the exact lesson/moral;
- dialogue intent;
- cultural context;
- uncertainty and narrative framing;
- sequence and outcome.

Do not summarize or modernize the lesson into a different ethical message.

## Commands

    python scripts/ingest/moral_tales_corpus.py
    python scripts/ingest/translate_moral_tales_corpus.py moral-en-merchant-seri
    python scripts/ingest/verify_moral_tales_translations.py moral-en-merchant-seri hi ar ur

Only publish after rights review, semantic QA and human editorial review.
