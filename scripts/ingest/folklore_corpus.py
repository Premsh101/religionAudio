#!/usr/bin/env python3
"""Rights-aware source materializer for the folklore corpus.

Each Project Gutenberg record in data/story-corpus/folklore/manifest.json carries
explicit ``source.extract`` start/end markers, so every record yields only its
own story (not the whole book). Records without an approved open source are
reported as CATALOG_ONLY.
Wikisource records with ``ingest: wikisource-api`` are fetched page by page via
the Wikisource API.

Usage:
    python scripts/ingest/folklore_corpus.py [story-id ...] [--cache-dir DIR] [--out-dir DIR] [--dry-run]

Default output: data/story-corpus/folklore/text/<lang>/<story-id>.txt (+ .manifest.json).
Use --out-dir to write somewhere outside the repository (e.g. when testing) and
--dry-run to print per-record word counts without writing anything.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from corpus_extract import ROOT, run  # noqa: E402

MANIFEST = ROOT / "data/story-corpus/folklore/manifest.json"
TEXT_ROOT = ROOT / "data/story-corpus/folklore/text"

if __name__ == "__main__":
    run(MANIFEST, TEXT_ROOT, __doc__)
