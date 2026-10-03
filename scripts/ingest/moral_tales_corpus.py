#!/usr/bin/env python3
"""Rights-aware source materializer for the moral tales and fables corpus.

Each Project Gutenberg record in data/story-corpus/moral-tales/manifest.json carries
explicit ``source.extract`` start/end markers, so every record yields only its
own story (not the whole book). Records without an approved open source are
reported as CATALOG_ONLY.

Usage:
    python scripts/ingest/moral_tales_corpus.py [story-id ...] [--cache-dir DIR] [--out-dir DIR] [--dry-run]

Default output: data/story-corpus/moral-tales/text/<lang>/<story-id>.txt (+ .manifest.json).
Use --out-dir to write somewhere outside the repository (e.g. when testing) and
--dry-run to print per-record word counts without writing anything.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from corpus_extract import ROOT, run  # noqa: E402

MANIFEST = ROOT / "data/story-corpus/moral-tales/manifest.json"
TEXT_ROOT = ROOT / "data/story-corpus/moral-tales/text"

if __name__ == "__main__":
    run(MANIFEST, TEXT_ROOT, __doc__)
