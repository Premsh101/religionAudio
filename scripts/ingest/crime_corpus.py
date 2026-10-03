#!/usr/bin/env python3
"""Rights-aware source materializer for the crime corpus."""
from __future__ import annotations
import datetime as dt, hashlib, json, re, sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "data/story-corpus/crime/manifest.json"
TEXT_ROOT = ROOT / "data/story-corpus/crime/text"

PROJECT_GUTENBERG = {
    "crime-en-rue-morgue": ("https://www.gutenberg.org/cache/epub/2147/pg2147.txt", "THE MURDERS IN THE RUE MORGUE"),
    "crime-en-marie-roget": ("https://www.gutenberg.org/cache/epub/2147/pg2147.txt", "THE MYSTERY OF MARIE ROGÊT"),
    "crime-en-purloined-letter": ("https://www.gutenberg.org/cache/epub/2148/pg2148.txt", "THE PURLOINED LETTER"),
    "crime-en-gold-bug": ("https://www.gutenberg.org/cache/epub/2147/pg2147.txt", "THE GOLD-BUG"),
    "crime-en-red-headed-league": ("https://www.gutenberg.org/cache/epub/1661/pg1661.txt", "THE RED-HEADED LEAGUE"),
    "crime-en-boscombe-valley": ("https://www.gutenberg.org/cache/epub/1661/pg1661.txt", "THE BOSCOMBE VALLEY MYSTERY"),
    "crime-en-five-orange-pips": ("https://www.gutenberg.org/cache/epub/1661/pg1661.txt", "THE FIVE ORANGE PIPS"),
    "crime-en-speckled-band": ("https://www.gutenberg.org/cache/epub/1661/pg1661.txt", "THE ADVENTURE OF THE SPECKLED BAND"),
    "crime-en-blue-carbuncle": ("https://www.gutenberg.org/cache/epub/1661/pg1661.txt", "THE ADVENTURE OF THE BLUE CARBUNCLE"),
    "crime-en-arsene-lupin-arrest": ("https://www.gutenberg.org/cache/epub/4014/pg4014.txt", "THE ARREST OF ARSÈNE LUPIN")
}

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def clean_pg(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(?s)^.*?\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\n", "", text, count=1)
    text = re.sub(r"(?s)\n\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$", "", text, count=1)
    return text.strip()

def extract_title(text: str, title: str) -> str:
    lines = text.splitlines()
    target = title.lower()
    matches = [i for i, line in enumerate(lines) if line.strip().lower() == target]
    if not matches:
        normalized = re.sub(r"[^a-z0-9]+", " ", target).strip()
        for i, line in enumerate(lines):
            candidate = re.sub(r"[^a-z0-9]+", " ", line.lower()).strip()
            if candidate == normalized:
                matches.append(i)
    if not matches:
        raise ValueError(f"Story heading not found: {title}")
    start = matches[0]
    end = len(lines)
    for i in range(start + 1, len(lines)):
        s = lines[i].strip()
        if 8 <= len(s) <= 90 and s == s.upper() and re.search(r"[A-Z]", s):
            if any(token in s.lower() for token in ("the ", "a ", "an ")):
                end = i
                break
    story = "\n".join(lines[start:end]).strip()
    if len(story) < 400:
        raise ValueError(f"Extracted story is unexpectedly short for {title}")
    return story

def fetch(url: str) -> bytes:
    req = Request(url, headers={"User-Agent":"religionAudio crime corpus ingester/1.0"})
    with urlopen(req, timeout=60) as response:
        return response.read()

def materialize_gutenberg(story_id: str, url: str, heading: str, language: str) -> None:
    raw = fetch(url)
    text = clean_pg(raw.decode("utf-8", errors="replace"))
    story = extract_title(text, heading)
    out_dir = TEXT_ROOT / language
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{story_id}.txt"
    out.write_text(story + "\n", encoding="utf-8")
    (out_dir / f"{story_id}.manifest.json").write_text(
        json.dumps({
            "storyId": story_id,
            "sourceUrl": url,
            "sourceHeading": heading,
            "retrievedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "sourceSha256": sha256(raw),
            "materializedSha256": sha256(story.encode("utf-8")),
            "method": "Project Gutenberg plain-text source; story extracted by verified heading",
            "rightsNote": "Project Gutenberg identifies the referenced work as public domain in the USA. Confirm target-jurisdiction status before commercial redistribution."
        }, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"MATERIALIZED {story_id} -> {out}")

def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    records = {r["id"]: r for r in manifest["records"]}
    wanted = sys.argv[1:] or list(records)
    for story_id in wanted:
        if story_id not in records:
            raise SystemExit(f"Unknown story id: {story_id}")
        record = records[story_id]
        if story_id in PROJECT_GUTENBERG:
            url, heading = PROJECT_GUTENBERG[story_id]
            materialize_gutenberg(story_id, url, heading, record["language"])
        else:
            source = record.get("source", {})
            print(f"CATALOG_ONLY {story_id}: edition/source rights still require verification ({source.get('url','no-url')})")

if __name__ == "__main__":
    main()
