#!/usr/bin/env python3
"""Fetch a Project Gutenberg WEB book and write a rights manifest."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from urllib.request import urlopen

BOOKS = {
    "ruth": {
        "id": "project-gutenberg-web-ruth",
        "title": "The World English Bible (WEB): Ruth",
        "url": "https://www.gutenberg.org/cache/epub/8235/pg8235.txt",
        "source_page": "https://www.gutenberg.org/ebooks/8235",
        "license": "Public Domain in USA; jurisdiction review before global commercial launch",
    }
}

def fetch(key: str) -> None:
    book = BOOKS[key]
    out = Path("data/library/christianity") / f"{key}-web.txt"
    manifest = out.with_suffix(".manifest.json")
    out.parent.mkdir(parents=True, exist_ok=True)

    with urlopen(book["url"], timeout=60) as response:
        data = response.read()

    text = data.decode("utf-8", errors="replace")
    match = re.search(r"\*\*\* START: .*?\*\*\*\s*(.*?)\s*\*\*\* END: .*?\*\*\*", text, flags=re.S | re.I)
    canonical = match.group(1).strip() if match else text

    out.write_text(canonical + "\n", encoding="utf-8")
    manifest.write_text(json.dumps({
        "source": "Project Gutenberg",
        "source_url": book["source_page"],
        "download_url": book["url"],
        "work": book["title"],
        "license": book["license"],
        "retrieved_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "sha256": hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
        "note": "Project Gutenberg states this work is public domain in the USA; check local law before global commercial distribution."
    }, indent=2) + "\n", encoding="utf-8")
    print(f"saved {out}")

if __name__ == "__main__":
    fetch("ruth")
