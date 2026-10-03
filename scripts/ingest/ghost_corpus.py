#!/usr/bin/env python3
"""Materialize the rights-reviewed ghost corpus into local text files.

The acquisition manifest is deliberately conservative:
- Project Gutenberg works are fetched from the official plain-text endpoint.
- Hindi Premchand is fetched from the explicitly open GitHub transcription recorded in the manifest.
- Urdu/Arabic are fetched from specific Wikisource page titles, not modern translations.
- Records marked SOURCE_ONLY are skipped until their exact edition is cleared.

Run:
    python scripts/ingest/ghost_corpus.py
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "data/story-corpus/ghost/manifest.json"
TEXT_ROOT = ROOT / "data/story-corpus/ghost/text"

PG_DOWNLOADS = {
    "https://www.gutenberg.org/ebooks/14522": "https://www.gutenberg.org/cache/epub/14522/pg14522.txt",
    "https://www.gutenberg.org/ebooks/12122": "https://www.gutenberg.org/cache/epub/12122/pg12122.txt",
    "https://www.gutenberg.org/ebooks/23218": "https://www.gutenberg.org/cache/epub/23218/pg23218.txt",
    "https://www.gutenberg.org/ebooks/27924": "https://www.gutenberg.org/cache/epub/27924/pg27924.txt",
}

HINDI_BHOOT_RAW = (
    "https://raw.githubusercontent.com/lastmansleeping/hindi-toolkit/"
    "3446347ddbf14b032be97cb633b0c7ed0625d512/"
    "hindi_toolkit/data/stories/12.txt"
)

WIKISOURCE_API = {
    "ur": "https://ur.wikisource.org/w/api.php",
    "ar": "https://ar.wikisource.org/w/api.php",
}


def fetch_bytes(url: str) -> bytes:
    req = Request(url, headers={"User-Agent": "ReligionAudioCorpus/1.0"})
    with urlopen(req, timeout=90) as response:
        return response.read()


def fetch_gutenberg(source_url: str) -> str:
    data = fetch_bytes(PG_DOWNLOADS[source_url]).decode("utf-8", errors="replace")
    match = re.search(
        r"\*\*\* START OF (?:THE )?PROJECT GUTENBERG EBOOK .*?\*\*\*",
        data,
        flags=re.I,
    )
    if match:
        data = data[match.end() :]
    end = re.search(r"\*\*\* END OF (?:THE )?PROJECT GUTENBERG EBOOK .*?\*\*\*", data, flags=re.I)
    if end:
        data = data[: end.start()]
    return data.strip() + "\n"


def fetch_wikisource(lang: str, page_title: str) -> str:
    base = WIKISOURCE_API[lang]
    params = (
        "?action=query&prop=revisions&rvprop=content&rvslots=main"
        "&format=json&formatversion=2&titles=" + quote(page_title, safe="")
    )
    payload = json.loads(fetch_bytes(base + params).decode("utf-8", errors="replace"))
    pages = payload.get("query", {}).get("pages", [])
    if not pages or "revisions" not in pages[0]:
        raise RuntimeError(f"Wikisource page not found: {lang}:{page_title}")
    content = pages[0]["revisions"][0]["slots"]["main"]["content"]
    return content.strip() + "\n"


def fetch_record(record: dict) -> str | None:
    rights = record.get("rights", "")
    if record.get("fullText") not in {"SOURCE_ONLY", "NOT_IMPORTED"}:
        return None

    source = record.get("source", {})
    if record.get("ingest") == "project-gutenberg":
        if rights != "PUBLIC_DOMAIN_CANDIDATE":
            return None
        return fetch_gutenberg(source["url"])

    if record.get("ingest") == "github-open-source-text":
        if rights != "PUBLIC_DOMAIN_WORK":
            return None
        return fetch_bytes(HINDI_BHOOT_RAW).decode("utf-8", errors="replace").strip() + "\n"

    if record.get("ingest") == "wikisource-api":
        if rights not in {"PUBLIC_DOMAIN_CANDIDATE", "PUBLIC_DOMAIN_TRADITION"}:
            return None
        page_title = source.get("pageTitle")
        if not page_title:
            raise RuntimeError(f"Missing pageTitle for {record['id']}")
        return fetch_wikisource(record["language"], page_title)

    return None


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    fetched = 0
    skipped = 0

    for record in manifest.get("records", []):
        text = fetch_record(record)
        if text is None:
            skipped += 1
            print(f"skip {record['id']} ({record.get('fullText')}/{record.get('rights')})")
            continue

        language = record["language"]
        out_dir = TEXT_ROOT / language
        out_dir.mkdir(parents=True, exist_ok=True)
        safe_id = re.sub(r"[^a-z0-9._-]+", "-", record["id"].lower())
        out = out_dir / f"{safe_id}.txt"
        meta = out.with_suffix(".manifest.json")

        out.write_text(text, encoding="utf-8")
        metadata = {
            "id": record["id"],
            "title": record["title"],
            "author": record.get("author"),
            "language": language,
            "origin": record.get("origin"),
            "rights": record.get("rights"),
            "source": record.get("source"),
            "retrievedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "note": "Materialized by the rights-first ghost corpus ingestion script. Verify jurisdiction-specific rights before commercial redistribution.",
        }
        meta.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        fetched += 1
        print(f"saved {out}")

    print(f"materialized={fetched} skipped={skipped}")


if __name__ == "__main__":
    main()
