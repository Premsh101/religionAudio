# Multilingual Ghost Translation Layer

Every ghost-corpus record has four target languages: Hindi, English, Arabic and Urdu.

## Fidelity rule

A target file is considered complete only when it was generated from the exact canonical source edition recorded in the parent manifest. The translation must preserve events, causal relationships, character identities, places, dates, numbers, dialogue intent, narrative point of view and supernatural terminology.

This directory does not permit a silent summary or a modern replacement edition.

## Pipeline

1. Materialize the exact source edition with scripts/ingest/ghost_corpus.py.
2. Run scripts/ingest/translate_ghost_corpus.py for the selected story.
3. Run semantic/structural review before marking the target READY.
4. Only then promote the story into the production Story / ContentItem records.

## Important

A source story can be public domain while a specific translation is copyrighted. This pipeline therefore creates new translations from the verified source rather than copying an unverified modern translation.

The completeness matrix is in translation-status.json.
