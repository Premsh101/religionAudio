# Content Ingestion

ReligionAudio uses a rights-first corpus pipeline.

## Approved/open starter corpus

### Buddhism
Dhammapada — Bhikkhu Sujato English translation from SuttaCentral Bilara Data. Stored in 26 segment files and marked CC0.

### Judaism
Genesis — JPS 1917 English edition from the Sefaria Export dataset. Stored as a source-wrapped JSON file and marked Public Domain in the source metadata.

### Christianity
World English Bible — Project Gutenberg / eBible.org. The repo contains a reproducible fetch script for Ruth and a registry entry for the full WEB. Project Gutenberg states the individual WEB work is public domain in the USA; country-specific review is still required before global commercial release.

### Islam
Qur'an Uthmani — Tanzil. The repo contains a reproducible verbatim fetch script. Tanzil's stated licence is CC BY 3.0 and the text must not be changed; attribution must be retained.

## Not automatic production sources

GRETIL, BDRC, Jain eLibrary, SGPC, Gita Supersite, Muktabodha and Avesta.org contain valuable material, but rights vary by text/edition or are restricted. These sources stay in the registry as discovery/reference sources until the exact work and licence are verified.

## Ingestion record

Every imported edition should retain:
- source URL
- source edition/version
- translator/editor
- language
- original language where known
- licence
- commercial-use flag
- attribution
- retrieval timestamp
- content hash where practical
- source path/API identifier

## Never do

- scrape a modern translation and assume it is free
- mix translations without edition metadata
- alter primary text while claiming it is the original edition
- generate AI paraphrase and store it as scripture
- strip licence/attribution information
