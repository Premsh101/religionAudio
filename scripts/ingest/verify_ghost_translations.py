#!/usr/bin/env python3
"""Semantic QA for source-locked ghost translations."""

from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "data/story-corpus/ghost/manifest.json"
TEXT_ROOT = ROOT / "data/story-corpus/ghost/text"
TRANS_ROOT = ROOT / "data/story-corpus/ghost/translations"

LANGS = ("hi", "en", "ar", "ur")
NAMES = {"hi": "Hindi", "en": "English", "ar": "Arabic", "ur": "Urdu"}

def chunks(text: str, max_chars: int = 8000) -> list[str]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    result, buf = [], ""
    for paragraph in paragraphs:
        if len(buf) + len(paragraph) + 2 <= max_chars:
            buf = f"{buf}\n\n{paragraph}".strip()
        else:
            if buf:
                result.append(buf)
            buf = paragraph
    if buf:
        result.append(buf)
    return result

def call_ai(source: str, translation: str, target: str, story: dict) -> dict:
    base = os.environ.get("AI_BASE_URL", "").rstrip("/")
    key = os.environ.get("AI_API_KEY", "")
    model = os.environ.get("AI_TRANSLATION_MODEL") or os.environ.get("AI_MODEL")
    if not base or not key or not model:
        raise RuntimeError("AI_BASE_URL, AI_API_KEY and AI_TRANSLATION_MODEL/AI_MODEL are required.")

    prompt = f"""Act as a strict literary-translation quality auditor.
Compare the source passage with its {NAMES[target]} translation.

Story: {story["title"]}
Source language: {NAMES[story["language"]]}
Target language: {NAMES[target]}

Check:
- Every event and causal relationship is preserved.
- No new facts, events, characters, motives, settings or conclusions were added.
- Character names, places, titles and supernatural beings are correctly identified.
- Numbers, dates, ages, quantities and sequence are unchanged.
- Dialogue intent is preserved.
- Narrative point of view and uncertainty are preserved.
- Cultural practices and supernatural claims are not changed.
- The translation is not a summary.

Return ONLY valid JSON with:
verdict = PASS or REVIEW
omissions = array
additions = array
entityIssues = array
numberIssues = array
meaningIssues = array

SOURCE:
{source}

TRANSLATION:
{translation}
"""

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Return only JSON and never rewrite the text."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.0,
    }
    req = Request(
        base + "/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type":"application/json","Authorization":f"Bearer {key}"},
    )
    with urlopen(req, timeout=180) as response:
        data = json.loads(response.read().decode("utf-8", errors="replace"))
    raw = data["choices"][0]["message"]["content"].strip()
    raw = re.sub(r"^\s*(?:json\s*)?\{", "{", raw, flags=re.I)
    raw = re.sub(r"\}\s*$", "}", raw)
    return json.loads(raw)

def extract_numbers(text: str) -> set[str]:
    return set(re.findall(r"\b\d+(?:[.,]\d+)?\b", text))

def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    records = {r["id"]: r for r in manifest["records"]}

    if not sys.argv[1:]:
        raise SystemExit("Provide a story id.")
    story_id = sys.argv[1]
    story = records.get(story_id)
    if not story:
        raise SystemExit(f"Unknown story id: {story_id}")

    requested = sys.argv[2:] or list(LANGS)
    if any(lang not in LANGS for lang in requested):
        raise SystemExit("Languages must be hi, en, ar or ur.")

    source_path = TEXT_ROOT / story["language"] / f"{story_id}.txt"
    if not source_path.exists():
        raise SystemExit(f"Source file not found: {source_path}")

    source = source_path.read_text(encoding="utf-8").strip()
    source_chunks = chunks(source)
    story_out = TRANS_ROOT / story_id
    story_out.mkdir(parents=True, exist_ok=True)

    report = {}
    for target in requested:
        if target == story["language"]:
            continue
        path = story_out / f"{target}.txt"
        if not path.exists():
            report[target] = {"verdict":"MISSING","issues":["Translation file does not exist."]}
            continue

        translation = path.read_text(encoding="utf-8").strip()
        results = []
        for index, source_chunk in enumerate(source_chunks):
            for attempt in range(3):
                try:
                    result = call_ai(source_chunk, translation, target, story)
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    time.sleep(2 ** attempt)
            results.append(result)
            print(f"{story_id} [{target}] QA {index+1}/{len(source_chunks)}")

        merged = {
            "verdict": "PASS" if all(r.get("verdict") == "PASS" for r in results) else "REVIEW",
            "chunks": results,
            "sourceNumbers": sorted(extract_numbers(source)),
            "translationNumbers": sorted(extract_numbers(translation)),
        }
        if merged["sourceNumbers"] != merged["translationNumbers"]:
            merged["verdict"] = "REVIEW"
            merged.setdefault("numberIssues", []).append("Numeric tokens differ; inspect the translation.")

        (story_out / f"{target}.qa.json").write_text(
            json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        report[target] = merged

    print(json.dumps(report, ensure_ascii=False, indent=2))
    if any(v.get("verdict") in {"REVIEW","MISSING"} for v in report.values()):
        raise SystemExit(2)

if __name__ == "__main__":
    main()
