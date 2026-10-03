# Thriller / Suspense / Adventure Corpus

This collection catalogs thriller stories for ReligionAudio / Sacred Stories.

## Four-language requirement

Every story targets:

- Hindi (hi)
- English (en)
- Arabic (ar)
- Urdu (ur)

The same canonical source edition must feed every translation. Do not translate a summary into another language and label it as a full story.

## Meaning-preservation rule

Preserve every plot event, threat, clue, escape, relationship, reveal, uncertainty, location, date, number, object, cultural detail, dialogue intention and point-of-view choice. Preserve suspense by keeping reveals in the same order. Do not insert modern explanations or remove source facts.

## Rights rule

Project Gutenberg lists the referenced older works as public domain in the USA, but its pages themselves instruct users outside the USA to check local law. Hindi Wikisource identifies Chandrakanta / Chandrakanta Santati public-domain material, while Urdu and Arabic sources remain edition-by-edition review items. Modern translations are not assumed to be free.

## Initial regional coverage

- English / British: Stevenson, Stoker, Shelley, Collins, Buchan, Lowndes, Wells
- Hindi / Indian: Devaki Nandan Khatri
- Urdu / Lucknow: Abdul Halim Sharar, Ratan Nath Sarshar
- Arabic literary tradition: One Thousand and One Nights adventure tales

## Commands

    python scripts/ingest/thriller_corpus.py
    python scripts/ingest/translate_thriller_corpus.py thriller-en-jekyll-hyde
    python scripts/ingest/verify_thriller_translations.py thriller-en-jekyll-hyde hi ar ur

Only publish translations that pass semantic QA and the project's human editorial review.
