#!/usr/bin/env python3
"""Source-locked multilingual translation for the crime corpus."""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "data/story-corpus/crime/manifest.json"
TEXT_ROOT = ROOT / "data/story-corpus/crime/text"
OUT_ROOT = ROOT / "data/story-corpus/crime/translations"

LANGUAGES = ("hi", "en", "ar", "ur")
LANGUAGE_NAMES = {"hi": "Hindi", "en": "English", "ar": "Arabic", "ur": "Urdu"}

GLOSSARY = {
    "detective": {"hi":"जासूस", "ar":"محقق", "ur":"جاسوس"},
    "clue": {"hi":"सुराग", "ar":"دليل", "ur":"سراغ"},
    "evidence": {"hi":"साक्ष्य", "ar":"أدلة", "ur":"شواہد"},
    "murder": {"hi":"हत्या", "ar":"جريمة قتل", "ur":"قتل"},
    "murderer": {"hi":"हत्यारा", "ar":"القاتل", "ur":"قاتل"},
    "crime": {"hi":"अपराध", "ar":"جريمة", "ur":"جرم"},
    "theft": {"hi":"चोरी", "ar":"سرقة", "ur":"چوری"},
    "thief": {"hi":"चोर", "ar":"سارق", "ur":"چور"},
    "suspect": {"hi":"संदिग्ध", "ar":"مشتبه به", "ur":"مشتبہ شخص"},
    "witness": {"hi":"गवाह", "ar":"شاهد", "ur":"گواہ"},
    "police": {"hi":"पुलिस", "ar":"الشرطة", "ur":"پولیس"},
    "constable": {"hi":"सिपाही", "ar":"شرطي", "ur":"سپاہی"},
    "detective_story": {"hi":"जासूसी कहानी", "ar":"قصة بوليسية", "ur":"جاسوسی کہانی"}
}

def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))

def chunks(text: str, max_chars: int = 9000) -> list[str]:
    paras = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
    result, buf = [], ""
    for para in paras:
        if len(buf) + len(para) + 2 <= max_chars:
            buf = f"{buf}\n\n{para}".strip()
        else:
            if buf:
                result.append(buf)
            if len(para) <= max_chars:
                buf = para
            else:
                sentences = re.split(r"(?<=[.!?।؟])\s+", para)
                buf = ""
                for sent in sentences:
                    if len(buf) + len(sent) + 1 <= max_chars:
                        buf = f"{buf} {sent}".strip()
                    else:
                        if buf:
                            result.append(buf)
                        buf = sent
    if buf:
        result.append(buf)
    return result

def ai_translate(text: str, target: str, record: dict) -> str:
    base = os.environ.get("AI_BASE_URL", "").rstrip("/")
    key = os.environ.get("AI_API_KEY", "")
    model = os.environ.get("AI_TRANSLATION_MODEL") or os.environ.get("AI_MODEL")
    if not base or not key or not model:
        raise RuntimeError("AI_BASE_URL, AI_API_KEY and AI_TRANSLATION_MODEL/AI_MODEL are required.")

    prompt = f"""You are a literary translator for a multilingual crime-story archive.
Translate the SOURCE PASSAGE into {LANGUAGE_NAMES[target]}.

NON-NEGOTIABLE RULES:
- Translate; do not summarize.
- Preserve every crime, clue, action, motive, relationship, inference and reveal.
- Preserve all cause-and-effect relationships and reveal timing.
- Preserve paragraph order as closely as the target language permits.
- Preserve proper names, locations, numbers, dates, measurements, titles and recurring terminology.
- Preserve dialogue intent, narrative point of view, uncertainty, suspicion, and evidence level.
- Preserve period-specific legal or police concepts instead of replacing them with modern equivalents.
- Do not add graphic detail, moral commentary, modern explanations, or footnotes.
- Do not change whether a statement is fact, allegation, suspicion, confession, rumor, or fiction.
- Keep repeated names and terms stable across the whole story.
- Return ONLY the translation.

STORY:
{record["title"]}

SOURCE LANGUAGE:
{LANGUAGE_NAMES[record["language"]]}

TARGET LANGUAGE:
{LANGUAGE_NAMES[target]}

TERMINOLOGY:
{json.dumps({k:v.get(target,k) for k,v in GLOSSARY.items()}, ensure_ascii=False)}

SOURCE PASSAGE:
{text}
"""

    payload = {
        "model": model,
        "messages": [
            {"role":"system","content":"Return only the faithful literary translation."},
            {"role":"user","content":prompt}
        ],
        "temperature":0.1
    }

    req = Request(
        base + "/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type":"application/json","Authorization":f"Bearer {key}"}
    )
    with urlopen(req, timeout=180) as response:
        data = json.loads(response.read().decode("utf-8", errors="replace"))
    return data["choices"][0]["message"]["content"].strip()

def source_path(record: dict) -> Path:
    return TEXT_ROOT / record["language"] / f"{record['id']}.txt"

def main() -> None:
    manifest = load_manifest()
    records = {r["id"]: r for r in manifest["records"]}
    wanted = sys.argv[1:] or list(records)

    for story_id in wanted:
        if story_id not in records:
            raise SystemExit(f"Unknown story id: {story_id}")
        record = records[story_id]
        src = source_path(record)
        if not src.exists():
            print(f"SKIP {story_id}: canonical source not found at {src}")
            continue

        source_text = src.read_text(encoding="utf-8").strip()
        source_chunks = chunks(source_text)
        out_dir = OUT_ROOT / story_id
        out_dir.mkdir(parents=True, exist_ok=True)

        for target in LANGUAGES:
            if target == record["language"]:
                continue

            out = out_dir / f"{target}.txt"
            meta = out_dir / f"{target}.manifest.json"
            parts = []

            for index, chunk in enumerate(source_chunks, start=1):
                for attempt in range(3):
                    try:
                        parts.append(ai_translate(chunk, target, record))
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        time.sleep(2 ** attempt)
                print(f"{story_id} -> {target}: chunk {index}/{len(source_chunks)}")

            translated = "\n\n".join(p for p in parts if p.strip()).strip() + "\n"
            out.write_text(translated, encoding="utf-8")
            meta.write_text(json.dumps({
                "storyId": story_id,
                "sourceLanguage": record["language"],
                "targetLanguage": target,
                "sourceSha256": sha256(source_text),
                "translationSha256": sha256(translated),
                "sourceCharacters": len(source_text),
                "translationCharacters": len(translated),
                "chunkCount": len(source_chunks),
                "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
                "method": "source-locked faithful translation via OpenAI-compatible endpoint",
                "qualityRule": "Human review is required before publication."
            }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
