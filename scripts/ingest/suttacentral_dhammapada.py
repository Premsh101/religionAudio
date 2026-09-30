#!/usr/bin/env python3
"""Fetch the published CC0 Sujato Dhammapada segments from Bilara Data."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.request import Request, urlopen

API = "https://api.github.com/repos/suttacentral/bilara-data/contents/translation/en/sujato/sutta/kn/dhp?ref=published"
OUT = Path("data/library/buddhism/dhammapada")

def get_json(url: str):
    request = Request(url, headers={"Accept":"application/vnd.github+json","User-Agent":"ReligionAudio-ingestion"})
    with urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    entries = [item for item in get_json(API) if item["type"] == "file" and item["name"].endswith(".json")]
    for entry in entries:
        raw = urlopen(entry["download_url"], timeout=60).read()
        payload = {
            "source":"SuttaCentral Bilara Data",
            "source_repository":"https://github.com/suttacentral/bilara-data",
            "source_path":entry["path"],
            "license":"CC0",
            "translator":"Bhikkhu Sujato",
            "language":"English",
            "work":"Dhammapada",
            "rights_review":"Re-verify source metadata before each production redistribution.",
            "passages":json.loads(raw.decode("utf-8"))
        }
        (OUT / entry["name"]).write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("saved", entry["name"])

if __name__ == "__main__":
    main()
