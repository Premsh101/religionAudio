# Story corpus conventions

Each category folder (`children`, `crime`, `folklore`, `ghost`, `moral-tales`, `mythology`, `thriller`)
holds a `manifest.json` (one record per story), a `translation-status.json` (the per-record
translation queue) and documentation. `epics/stories.json` is a separate, already-materialized set.

## Record fields shared by all manifests

| Field | Meaning |
|---|---|
| `id` | `<category>-<lang>-<slug>`; unique across **all** manifests. The slug matches the title. |
| `language` | Language of the source text used for translation (`en`, `hi`, `ar`, `ur`). |
| `year` | First publication year of the story/work, or of the cited translation when the record is a translation (e.g. Grimm/Hunt 1884, Kalevala/Crawford 1888). Edition details go in `source.edition`/`source.note`. |
| `category` | Semantic kind (see "Categories" below). |
| `ageBand` | Catalog guidance in one of two formats: a range `"8-12"` or a minimum `"13+"`. `"18+"` marks adult-only material. |
| `contentNotes` | Array of short, specific warnings (slurs, stereotypes, sexual content, graphic violence, exclusions). Empty array when nothing needs flagging. |
| `rights` | One of the four labels below. |
| `source` | Exact source edition. Project Gutenberg sources carry `url`, `rawUrl` and `extract` markers. |

## Rights labels

| Label | Use | Materialized by the ingest scripts? |
|---|---|---|
| `PD_WORK` | Work and the cited Project Gutenberg edition/translation are public domain in the USA (PG-cleared). Check target-jurisdiction status before commercial distribution outside the USA. | yes |
| `PD_WORK_EDITION_REVIEW` | Underlying work is public domain, but the specific scan/transcription/edition (Wikisource, Rekhta, web text) or a special right (e.g. Peter Pan's UK GOSH royalty right, see `rightsNote`) still needs review. | yes, when a fetchable source is listed |
| `TRADITIONAL_REVIEW` | Anonymous/traditional narrative (e.g. One Thousand and One Nights); the cited printed edition and transcription need review. | yes, when a fetchable source is listed |
| `RIGHTS_REVIEW` | No verified open source edition yet. Catalog-only. | no |

Mapping from the labels used before 2026-10:

| Old label | New label |
|---|---|
| `PUBLIC_DOMAIN_WORK`, `PUBLIC_DOMAIN_CANDIDATE` (PG), `PUBLIC_DOMAIN_USA_JURISDICTION_REVIEW`, `SOURCE_REVIEW` (PG mythology) | `PD_WORK` |
| `PUBLIC_DOMAIN_SOURCE_EDITION_REVIEW`, `PUBLIC_DOMAIN_WORK_SOURCE_EDITION_REVIEW`, `PUBLIC_DOMAIN_SOURCE_RIGHTS_REVIEW`, any `PD_WORK` whose source is not Project Gutenberg | `PD_WORK_EDITION_REVIEW` |
| `TRADITIONAL_SOURCE_REVIEW`, `PUBLIC_DOMAIN_TRADITION`, `EDITION_REVIEW_REQUIRED` | `TRADITIONAL_REVIEW` |
| (records without any specific source) | `RIGHTS_REVIEW` |

## Categories

Manifests group stories by listening shelf, so a manifest can contain a few records whose
`category` differs from the folder name. The `category` field is the semantic truth:

- `SCRIPTURE` — living sacred text (the Bhagavad-Gita in `mythology/`, flagged with `scriptureNote`).
  Present it as scripture, never as myth or fiction. Move it when a scripture collection exists.
- `ADVENTURE` — adventure/quest narratives kept on the thriller shelf (`thriller-ur-fasana-azad`,
  `thriller-ar-city-of-brass`). Adventure is not a separate collection yet (see CONTENT_ROADMAP.md).
- `FABLE` — animal/moral fables (Aesop, Jataka in `children/`).
- `FOLKLORE`, `SUPERNATURAL_FOLKLORE`, `JINN_GHOST_FOLKLORE`, `GHOST_STORY`, `CRIME_STORY`,
  `THRILLER`, `CHILDREN_STORY`, `MORAL_TALE`, `MYTHOLOGY` — as named.

Records moved between manifests keep a `movedFrom` note.

## Extraction markers (`source.extract`)

Every Project Gutenberg record says exactly where its story starts and stops, so each record
materializes only its own story rather than a whole book:

```json
"extract": {
  "start": "II. THE RED-HEADED LEAGUE",
  "startOccurrence": 1,
  "end": "III. A CASE OF IDENTITY",
  "exclude": [{"start": "...", "end": "...", "reason": "..."}]
}
```

- `start` is an exact line of the PG text (whitespace-normalised, case-sensitive);
  `startOccurrence` skips table-of-contents hits.
- `end` is the first line **after** the story (exclusive). If it is omitted, the story runs to
  the end of the PG body (single-work ebooks such as novels).
- `exclude` removes editorially excluded sections inside the range (Grimm KHM 110; the Just So
  leopard tale in the children's edition).
- For Wikisource scan pages without line-level headings, `startText`/`endText` cut by substring.

The shared logic lives in `scripts/ingest/corpus_extract.py`; each `<category>_corpus.py` is a thin
wrapper. A wrong marker fails loudly instead of returning the wrong text.

```
python scripts/ingest/folklore_corpus.py --cache-dir /tmp/pgcache --dry-run      # word counts only
python scripts/ingest/folklore_corpus.py --cache-dir /tmp/pgcache --out-dir /tmp/corpus-out
python scripts/ingest/folklore_corpus.py folklore-en-tom-tit-tot                   # writes text/<lang>/
```

By default the scripts write to `data/story-corpus/<category>/text/<lang>/<id>.txt` (where the
translate scripts read from). Apart from the committed Premchand text
(`ghost/text/hi/ghost-hi-bhoot-premchand.txt`), materialized texts are not committed yet; use
`--out-dir` for local runs.

## Ghost `fullText` values

`SOURCE_ONLY` (catalogued, no text yet), `PG_EXTRACT` (materialized from PG by markers),
`TEXT_PRESENT` (source text committed in the repository, referenced by `source.localPath`).
