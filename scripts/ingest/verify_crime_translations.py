#!/usr/bin/env python3
"""Semantic QA for source-locked crime-story translations."""
from __future__ import annotations
import json, os, re, sys, time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "data/story-corpus/crime/manifest.json"
TEXT_ROOT = ROOT / "data/story-corpus/crime/text"
TRANS_ROOT = ROOT / "data/story-corpus/crime/translations"
LANGS = ("hi","en","ar","ur")
NAMES = {"hi":"Hindi","en":"English","ar":"Arabic","ur":"Urdu"}

def call_ai(source: str, translation: str, target: str, story: dict) -> dict:
    base = os.environ.get("AI_BASE_URL","").rstrip("/")
    key = os.environ.get("AI_API_KEY","")
    model = os.environ.get("AI_TRANSLATION_MODEL") or os.environ.get("AI_MODEL")
    if not base or not key or not model:
        raise RuntimeError("AI_BASE_URL, AI_API_KEY and AI_TRANSLATION_MODEL/AI_MODEL are required.")
    prompt = f"""Act as a strict literary-translation quality auditor.
Compare the SOURCE PASSAGE with its {NAMES[target]} translation.

Story: {story["title"]}
Source language: {NAMES[story["language"]]}
Target language: {NAMES[target]}

Check:
- Every crime, clue, action, motive, inference and reveal is preserved.
- No events, facts, characters, motives, settings or conclusions were added.
- Character names, places, titles and recurring terms are correct.
- Numbers, dates, ages, quantities and ordering are unchanged.
- Dialogue intent is preserved.
- Point of view, uncertainty, suspicion and evidence level are preserved.
- Period-specific legal/police concepts are preserved.
- The translation is not a summary.

Return ONLY a JSON object with verdict, omissions, additions, entityIssues, numberIssues and meaningIssues.

SOURCE:
{source}

TRANSLATION:
{translation}
"""
    payload = {"model":model,"messages":[
        {"role":"system","content":"Return only valid JSON."},
        {"role":"user","content":prompt}
    ],"temperature":0.0}
    req = Request(
        base + "/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type":"application/json","Authorization":"Bearer " + key}
    )
    with urlopen(req, timeout=180) as response:
        data = json.loads(response.read().decode("utf-8", errors="replace"))
    return json.loads(data["choices"][0]["message"]["content"].strip())

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

def numbers(text: str) -> list[str]:
    return sorted(re.findall(r"\b\d+(?:[.,]\d+)?\b", text))

def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    records = {r["id"]: r for r in manifest["records"]}
    if len(sys.argv) < 2:
        raise SystemExit("Usage: verify_crime_translations.py STORY_ID [hi] [en] [ar] [ur]")
    story_id = sys.argv[1]
    story = records.get(story_id)
    if not story:
        raise SystemExit(f"Unknown story id: {story_id}")
    source_path = TEXT_ROOT / story["language"] / f"{story_id}.txt"
    if not source_path.exists():
        raise SystemExit(f"Canonical source file not found: {source_path}")
    source = source_path.read_text(encoding="utf-8").strip()
    requested = sys.argv[2:] or list(LANGS)
    out_dir = TRANS_ROOT / story_id
    out_dir.mkdir(parents=True, exist_ok=True)
    overall = {}
    for target in requested:
        if target not in LANGS:
            raise SystemExit("Languages must be hi, en, ar or ur.")
        if target == story["language"]:
            continue
        path = out_dir / f"{target}.txt"
        if not path.exists():
            overall[target] = {"verdict":"MISSING","issues":["Translation file does not exist."]}
            continue
        translation = path.read_text(encoding="utf-8").strip()
        results = []
        for idx, source_chunk in enumerate(chunks(source), start=1):
            for attempt in range(3):
                try:
                    results.append(call_ai(source_chunk, translation, target, story))
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    time.sleep(2 ** attempt)
            print(f"{story_id} [{target}] QA {idx}")
        merged = {
            "verdict":"PASS" if all(r.get("verdict") == "PASS" for r in results) else "REVIEW",
            "chunks":results,
            "sourceNumbers":numbers(source),
            "translationNumbers":numbers(translation)
        }
        if merged["sourceNumbers"] != merged["translationNumbers"]:
            merged["verdict"] = "REVIEW"
            merged["numberIssues"] = ["Numeric tokens differ; inspect dates, quantities, ages and numbering."]
        (out_dir / f"{target}.qa.json").write_text(
            json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8"
        )
        overall[target] = merged
    print(json.dumps(overall, ensure_ascii=False, indent=2))
    if any(v.get("verdict") in {"REVIEW","MISSING"} for v in overall.values()):
        raise SystemExit(2)

if __name__ == "__main__":
    main()
