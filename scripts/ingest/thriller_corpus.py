#!/usr/bin/env python3
"""Rights-aware source materializer for the thriller corpus."""
from __future__ import annotations
import datetime as dt, hashlib, json, re, sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "data/story-corpus/thriller/manifest.json"
TEXT_ROOT = ROOT / "data/story-corpus/thriller/text"

PROJECT_GUTENBERG = {
  "thriller-en-jekyll-hyde": ("https://www.gutenberg.org/cache/epub/43/pg43.txt", "STRANGE CASE OF DR. JEKYLL AND MR. HYDE"),
  "thriller-en-dracula": ("https://www.gutenberg.org/cache/epub/345/pg345.txt", "DRACULA"),
  "thriller-en-frankenstein": ("https://www.gutenberg.org/cache/epub/84/pg84.txt", "FRANKENSTEIN; OR, THE MODERN PROMETHEUS"),
  "thriller-en-woman-in-white": ("https://www.gutenberg.org/cache/epub/583/pg583.txt", "THE WOMAN IN WHITE"),
  "thriller-en-moonstone": ("https://www.gutenberg.org/cache/epub/155/pg155.txt", "THE MOONSTONE"),
  "thriller-en-thirty-nine-steps": ("https://www.gutenberg.org/cache/epub/558/pg558.txt", "THE THIRTY-NINE STEPS"),
  "thriller-en-lodger": ("https://www.gutenberg.org/cache/epub/2014/pg2014.txt", "THE LODGER"),
  "thriller-en-moreau": ("https://www.gutenberg.org/cache/epub/159/pg159.txt", "THE ISLAND OF DOCTOR MOREAU")
}

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def clean_pg(text: str) -> str:
    text = text.replace("\r\n","\n").replace("\r","\n")
    text = re.sub(r"(?s)^.*?\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\n","",text,count=1)
    text = re.sub(r"(?s)\n\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$","",text,count=1)
    return text.strip()

def extract_heading(text: str, heading: str) -> str:
    lines = text.splitlines()
    norm = re.sub(r"[^a-z0-9]+"," ",heading.lower()).strip()
    matches = []
    for i,line in enumerate(lines):
        cand = re.sub(r"[^a-z0-9]+"," ",line.lower()).strip()
        if cand == norm:
            matches.append(i)
    if not matches:
        raise ValueError(f"Story heading not found: {heading}")
    start = matches[0]
    end = len(lines)
    # For novels, keep the full book. Extraction starts at the title and
    # continues to the end because chapter headings are not reliable boundaries.
    story = "\n".join(lines[start:end]).strip()
    if len(story) < 1000:
        raise ValueError(f"Unexpectedly short source for {heading}")
    return story

def fetch(url: str) -> bytes:
    req = Request(url, headers={"User-Agent":"religionAudio thriller corpus ingester/1.0"})
    with urlopen(req, timeout=90) as response:
        return response.read()

def materialize(story_id: str, language: str, url: str, heading: str) -> None:
    raw = fetch(url)
    story = extract_heading(clean_pg(raw.decode("utf-8",errors="replace")),heading)
    out_dir = TEXT_ROOT / language
    out_dir.mkdir(parents=True,exist_ok=True)
    out = out_dir / f"{story_id}.txt"
    out.write_text(story+"\n",encoding="utf-8")
    (out_dir / f"{story_id}.manifest.json").write_text(
        json.dumps({
          "storyId":story_id,"sourceUrl":url,"sourceHeading":heading,
          "retrievedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
          "sourceSha256":sha256(raw),
          "materializedSha256":sha256(story.encode("utf-8")),
          "method":"Project Gutenberg plain-text source",
          "rightsNote":"Project Gutenberg identifies the referenced edition as public domain in the USA. Confirm target-jurisdiction status before commercial redistribution."
        },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"MATERIALIZED {story_id} -> {out}")

def main() -> None:
    records = {r["id"]:r for r in json.loads(MANIFEST.read_text(encoding="utf-8"))["records"]}
    wanted = sys.argv[1:] or list(records)
    for story_id in wanted:
        if story_id not in records:
            raise SystemExit(f"Unknown story id: {story_id}")
        rec = records[story_id]
        if story_id in PROJECT_GUTENBERG:
            url,heading = PROJECT_GUTENBERG[story_id]
            materialize(story_id,rec["language"],url,heading)
        else:
            source = rec.get("source",{})
            print(f"CATALOG_ONLY {story_id}: exact open edition still requires verification ({source.get('url','no-url')})")

if __name__=="__main__":
    main()
