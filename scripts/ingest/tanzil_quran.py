#!/usr/bin/env python3
"""
Download the Tanzil Uthmani Quran text without modifying its bytes.

Tanzil's licence permits copying/distribution of verbatim text with
attribution, while its terms state that the text must not be changed.
This script therefore stores the source file verbatim and writes a
small sidecar manifest for the application to read.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

URL="https://raw.githubusercontent.com/acfatah/tanzil/main/data/quran-uthmani.txt"
OUT=Path("data/library/islam/quran-uthmani.txt")
META=Path("data/library/islam/quran-uthmani.manifest.json")

def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(URL, timeout=60) as response:
        data=response.read()

    OUT.write_bytes(data)
    META.write_text(json.dumps({
        "source":"Tanzil Project",
        "source_url":"https://tanzil.net/",
        "source_file_url":URL,
        "license":"CC BY 3.0",
        "verbatim":True,
        "sha256":hashlib.sha256(data).hexdigest(),
        "retrieved_by":"scripts/ingest/tanzil_quran.py"
    },indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"saved {OUT} ({len(data)} bytes)")

if __name__=="__main__":
    main()
