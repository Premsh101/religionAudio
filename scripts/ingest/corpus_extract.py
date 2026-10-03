#!/usr/bin/env python3
"""Shared source-extraction helpers for the story-corpus ingesters.

Every Project Gutenberg backed record declares explicit extraction markers in
its manifest under ``source.extract``::

    "extract": {
      "start": "II. THE RED-HEADED LEAGUE",   # exact line where the story begins
      "startOccurrence": 2,                   # optional, 1-based; skips table-of-contents hits
      "end": "III. A CASE OF IDENTITY",       # optional: first line AFTER the story (exclusive)
      "endOccurrence": 1,                     # optional, counted after the start line
      "exclude": [                            # optional editorial exclusions inside the range
        {"start": "...", "end": "...", "reason": "..."}
      ]
    }

For Wikisource scan pages, whose tale headings often sit mid-paragraph, a
substring variant is used instead: ``{"startText": "...", "endText": "..."}``.

If ``end`` is omitted the story runs to the end of the PG body (used for single
works such as novels, where ``start`` skips the front matter). Matching is an
exact comparison of the stripped line with runs of whitespace collapsed, so a
marker must be copied verbatim from the source edition. There is deliberately
no fuzzy matching: a wrong marker fails loudly instead of silently returning
the wrong text (or the whole rest of the book).

Downloads can be cached (``--cache-dir`` or ``PG_CACHE_DIR``) so repeated runs
and tests do not refetch whole books, and ``--out-dir`` lets tests write the
materialized text outside the repository.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
USER_AGENT = "religionAudio corpus ingester/2.0"

_START_RE = re.compile(
    r"^\*\*\*\s*START OF (?:THE |THIS )?PROJECT GUTENBERG E-?BOOK.*?\*\*\*[^\n]*\n",
    re.IGNORECASE | re.MULTILINE,
)
_END_RE = re.compile(
    r"^\*\*\*\s*END OF (?:THE |THIS )?PROJECT GUTENBERG E-?BOOK.*$",
    re.IGNORECASE | re.MULTILINE,
)
# Older PG files use "*END*THE SMALL PRINT!" headers and "End of the Project
# Gutenberg EBook" footers; handle those as a fallback.
_OLD_START_RE = re.compile(r"^\*END\*THE SMALL PRINT.*$\n", re.IGNORECASE | re.MULTILINE)
_OLD_END_RE = re.compile(r"^End of (?:the )?Project Gutenberg'?s? .*$", re.IGNORECASE | re.MULTILINE)

WIKISOURCE_API = {
    "ur": "https://ur.wikisource.org/w/api.php",
    "ar": "https://ar.wikisource.org/w/api.php",
    "hi": "https://hi.wikisource.org/w/api.php",
}

PG_RIGHTS_NOTE = (
    "Project Gutenberg identifies this edition as public domain in the USA. "
    "Confirm target-jurisdiction status before commercial redistribution."
)


class ExtractionError(ValueError):
    pass


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def pg_txt_url(ebook_id: int | str) -> str:
    return f"https://www.gutenberg.org/cache/epub/{ebook_id}/pg{ebook_id}.txt"


def ebook_id_from_url(url: str) -> str | None:
    m = re.search(r"gutenberg\.org/(?:cache/epub|ebooks|files)/(\d+)", url or "")
    return m.group(1) if m else None


def pg_raw_url(source: dict) -> str | None:
    """Plain-text URL for a manifest ``source`` object, if it is a PG source."""
    if source.get("rawUrl") and "gutenberg.org" in source["rawUrl"]:
        return source["rawUrl"]
    pg_id = ebook_id_from_url(source.get("url", ""))
    return pg_txt_url(pg_id) if pg_id else None


def strip_pg(text: str) -> str:
    """Normalise newlines and remove the Project Gutenberg header and licence footer."""
    text = text.replace("﻿", "").replace("\r\n", "\n").replace("\r", "\n")
    m = _START_RE.search(text) or _OLD_START_RE.search(text)
    if m:
        text = text[m.end():]
    m = _END_RE.search(text)
    if m:
        text = text[: m.start()]
    # Some files carry both the modern "*** END" marker and an older
    # "End of Project Gutenberg's ..." line just before it.
    m = _OLD_END_RE.search(text, max(0, len(text) - 3000))
    if m:
        text = text[: m.start()]
    return text.strip("\n")


def _norm(line: str) -> str:
    return " ".join(line.split())


def find_line(lines: list[str], marker: str, begin: int = 0, occurrence: int = 1, stop: int | None = None) -> int:
    want = _norm(marker)
    seen = 0
    for i in range(begin, len(lines) if stop is None else stop):
        if _norm(lines[i]) == want:
            seen += 1
            if seen == occurrence:
                return i
    raise ExtractionError(f"marker not found (occurrence {occurrence}): {marker!r}")


def extract_text_span(text: str, spec: dict) -> str:
    """Substring variant for sources without line-level headings (e.g. Wikisource
    scan pages where a tale heading sits mid-paragraph): keep the text from the
    first ``startText`` (inclusive) to the next ``endText`` (exclusive)."""
    a = text.find(spec["startText"])
    if a < 0:
        raise ExtractionError(f"startText not found: {spec['startText']!r}")
    b = len(text)
    if spec.get("endText"):
        b = text.find(spec["endText"], a + len(spec["startText"]))
        if b < 0:
            raise ExtractionError(f"endText not found: {spec['endText']!r}")
    return re.sub(r"\n{3,}", "\n\n", text[a:b].strip())


def extract(text: str, spec: dict) -> str:
    """Return the story delimited by ``spec`` from PG-stripped ``text``."""
    if spec and spec.get("startText"):
        return extract_text_span(text, spec)
    if not spec or not spec.get("start"):
        raise ExtractionError("missing source.extract.start marker")
    lines = text.split("\n")
    start = find_line(lines, spec["start"], 0, int(spec.get("startOccurrence", 1)))
    end = len(lines)
    if spec.get("end"):
        end = find_line(lines, spec["end"], start + 1, int(spec.get("endOccurrence", 1)))
    keep = lines[start:end]
    for ex in spec.get("exclude", []):
        a = find_line(keep, ex["start"])
        b = find_line(keep, ex["end"], a + 1)
        keep = keep[:a] + keep[b:]
    story = "\n".join(keep).strip()
    return re.sub(r"\n{3,}", "\n\n", story)


def word_count(text: str) -> int:
    return len(re.findall(r"\w+", text))


def fetch(url: str, cache_dir: Path | None = None) -> bytes:
    cache_file = None
    if cache_dir:
        cache_dir.mkdir(parents=True, exist_ok=True)
        pg_id = ebook_id_from_url(url)
        if pg_id and url.endswith(".txt"):
            name = f"pg{pg_id}.txt"
        else:
            name = hashlib.sha1(url.encode("utf-8")).hexdigest()[:16] + ".cache"
        cache_file = cache_dir / name
        if cache_file.exists() and cache_file.stat().st_size > 0:
            return cache_file.read_bytes()
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            req = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(req, timeout=120) as response:
                data = response.read()
            break
        except HTTPError as exc:  # Wikimedia rate limits answer 429
            last_error = exc
            if exc.code not in (429, 503):
                raise
            time.sleep(10 * (attempt + 1))
    else:
        raise RuntimeError(f"giving up on {url}: {last_error}")
    if cache_file:
        cache_file.write_bytes(data)
    return data


_KEEP_TEMPLATES = {"وسط", "center", "c", "centre", "larger", "smaller", "big", "small", "مركز"}


def _strip_templates(text: str) -> str:
    out, i = [], 0
    while i < len(text):
        if text.startswith("{{", i):
            depth, j = 0, i
            while j < len(text):
                if text.startswith("{{", j):
                    depth += 1; j += 2
                elif text.startswith("}}", j):
                    depth -= 1; j += 2
                    if depth == 0:
                        break
                else:
                    j += 1
            inner = text[i + 2 : j - 2]
            name, _, rest = inner.partition("|")
            if name.strip().lower() in _KEEP_TEMPLATES and rest:
                out.append(_strip_templates(rest.split("|")[-1]))
            i = j
        else:
            out.append(text[i]); i += 1
    return "".join(out)


def wikitext_to_plain(text: str) -> str:
    """Very small wikitext cleaner for prose pages (Wikisource main and Page namespaces)."""
    text = re.sub(r"(?s)<noinclude>.*?</noinclude>", "", text)
    text = re.sub(r"(?s)<!--.*?-->", "", text)
    text = re.sub(r"(?s)<ref[^>]*?/>|<ref[^>]*>.*?</ref>", "", text)
    text = _strip_templates(text)
    text = re.sub(r"\[\[(?:[^\]|:]*:)[^\]]*\]\]", "", text)          # categories / files / interwiki
    text = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", text)          # [[target|label]]
    text = re.sub(r"\[\[([^\]]*)\]\]", r"\1", text)                   # [[target]]
    text = re.sub(r"'{2,}", "", text)                                 # bold/italic quotes
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"^=+\s*(.*?)\s*=+\s*$", r"\1", text, flags=re.MULTILINE)
    text = text.replace("&nbsp;", " ")
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def fetch_wikisource(lang: str, page_title: str, cache_dir: Path | None = None) -> str:
    """Fetch a Wikisource page's wikitext (action=raw) and reduce it to plain prose.

    The TextExtracts API returns empty extracts for proofread ``Page:`` pages and
    for many transcluded main-namespace pages, so raw wikitext is used instead.
    """
    base = WIKISOURCE_API[lang].replace("/w/api.php", "/w/index.php")
    url = f"{base}?action=raw&title=" + quote(page_title, safe="")
    raw = fetch(url, cache_dir).decode("utf-8", errors="replace")
    text = wikitext_to_plain(raw)
    if re.search(r"<pages\b", raw) and word_count(text) < 200:
        raise ExtractionError(f"Wikisource page only transcludes scan pages; list the Page: titles instead: {lang}:{page_title}")
    if not text:
        raise ExtractionError(f"Wikisource page empty or not found: {lang}:{page_title}")
    return text


def _args(description: str, default_out: Path) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=description)
    p.add_argument("ids", nargs="*", help="story ids to materialize (default: all)")
    env_cache = os.environ.get("PG_CACHE_DIR")
    p.add_argument("--cache-dir", type=Path, default=Path(env_cache) if env_cache else None,
                   help="directory for cached source downloads (or set PG_CACHE_DIR)")
    p.add_argument("--out-dir", type=Path, default=default_out,
                   help="root directory for materialized text (default: the category's text/ folder)")
    p.add_argument("--dry-run", action="store_true",
                   help="extract and report word counts without writing any files")
    return p.parse_args()


def materialize_record(rec: dict, cache_dir: Path | None) -> tuple[str, dict] | None:
    """Return (story text, provenance) for a record, or None if it is catalog-only."""
    source = rec.get("source") or {}
    spec = source.get("extract")
    raw_url = pg_raw_url(source)
    if spec and raw_url:
        raw = fetch(raw_url, cache_dir)
        story = extract(strip_pg(raw.decode("utf-8", errors="replace")), spec)
        return story, {
            "sourceUrl": raw_url,
            "sourceSha256": sha256(raw),
            "extract": spec,
            "method": "Project Gutenberg plain text; PG header/licence stripped; story cut at explicit manifest markers",
            "rightsNote": PG_RIGHTS_NOTE,
        }
    titles = source.get("pageTitles") or ([source["pageTitle"]] if source.get("pageTitle") else [])
    if rec.get("ingest") == "wikisource-api" and titles:
        lang = source.get("wikisourceLanguage", rec["language"])
        story = "\n\n".join(fetch_wikisource(lang, t, cache_dir) for t in titles).strip()
        if spec:
            story = extract(story, spec)
        return story, {
            "sourceUrl": source.get("url"),
            "pageTitles": titles,
            "extract": spec,
            "method": "Wikisource API plain-text extract of the listed page titles",
            "rightsNote": "Verify the transcription/edition rights of the Wikisource page before redistribution.",
        }
    if source.get("localPath"):
        path = ROOT / source["localPath"]
        story = path.read_text(encoding="utf-8").strip()
        return story, {
            "sourceUrl": source.get("url"),
            "localPath": source["localPath"],
            "method": "Committed source text",
            "rightsNote": "See manifest rights field.",
        }
    return None


def run(manifest_path: Path, default_out: Path, description: str) -> list[tuple[str, int]]:
    """Generic CLI driver shared by the per-category ingest scripts."""
    args = _args(description, default_out)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    records = {r["id"]: r for r in manifest["records"]}
    wanted = args.ids or list(records)
    results: list[tuple[str, int]] = []
    failures = 0
    for sid in wanted:
        if sid not in records:
            raise SystemExit(f"Unknown story id: {sid}")
        rec = records[sid]
        if rec.get("rights") == "RIGHTS_REVIEW":
            print(f"CATALOG_ONLY {sid}: rights not yet verified (RIGHTS_REVIEW)")
            continue
        try:
            got = materialize_record(rec, args.cache_dir)
        except Exception as exc:  # report and continue so one bad record does not hide others
            failures += 1
            print(f"FAILED {sid}: {exc}")
            continue
        if got is None:
            print(f"CATALOG_ONLY {sid}: exact open source/edition still requires verification "
                  f"({(rec.get('source') or {}).get('url', 'no-url')})")
            continue
        story, provenance = got
        words = word_count(story)
        results.append((sid, words))
        if args.dry_run:
            first = next((l.strip() for l in story.splitlines() if l.strip()), "")
            last = next((l.strip() for l in reversed(story.splitlines()) if l.strip()), "")
            print(f"OK {sid}\t{words} words\t| {first[:50]} ... {last[-50:]}")
            continue
        out_dir = args.out_dir / rec["language"]
        out_dir.mkdir(parents=True, exist_ok=True)
        out_txt = out_dir / f"{sid}.txt"
        local = provenance.get("localPath")
        if not (local and out_txt.resolve() == (ROOT / local).resolve()):
            out_txt.write_text(story + "\n", encoding="utf-8")
        meta = {
            "storyId": sid,
            "title": rec.get("title"),
            **provenance,
            "retrievedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "materializedSha256": sha256(story.encode("utf-8")),
            "wordCount": words,
        }
        (out_dir / f"{sid}.manifest.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"MATERIALIZED {sid} ({words} words) -> {out_dir / (sid + '.txt')}")
    if failures:
        raise SystemExit(f"{failures} record(s) failed")
    return results
