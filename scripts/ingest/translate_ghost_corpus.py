#!/usr/bin/env python3
"""Create source-locked Hindi/English/Arabic/Urdu translations for the ghost corpus.

The script intentionally refuses to translate records until a canonical source text
exists locally. It uses an OpenAI-compatible endpoint configured by:
  AI_BASE_URL
  AI_API_KEY
  AI_TRANSLATION_MODEL (falls back to AI_MODEL)

Output:
  data/story-corpus/ghost/translations/<story-id>/<lang>.txt
  data/story-corpus/ghost/translations/<story-id>/<lang>.manifest.json

The translation prompt is designed for fidelity, not summarisation.
"""

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
MANIFEST = ROOT / "data/story-corpus/ghost/manifest.json"
TEXT_ROOT = ROOT / "data/story-corpus/ghost/text"
OUT_ROOT = ROOT / "data/story-corpus/ghost/translations"
LANGUAGES = ("hi", "en", "ar", "ur")

LANGUAGE_NAMES = {
    "hi": "Hindi",
    "en": "English",
    "ar": "Arabic",
    "ur": "Urdu",
}

GLOSSARY = {
    "ghost": {"hi": "भूत / प्रेत", "ar": "شبح / روح", "ur": "بھوت / روح"},
    "spirit": {"hi": "आत्मा / प्रेत", "ar": "روح", "ur": "روح / آسیب"},
    "jinn": {"hi": "जिन्न", "ar": "جن", "ur": "جن"},
    "ifrit": {"hi": "इफ़रीत", "ar": "عفريت", "ur": "عفریت"},
    "vetala": {"hi": "वेताल", "ar": "فيتالا", "ur": "ویتال"},
    "banshee": {"hi": "बैंशी", "ar": "بانشي", "ur": "بانشی"},
    "haunted": {"hi": "प्रेतग्रस्त / भुतहा", "ar": "مسكون بالأشباح", "ur": "بھوت زدہ / آسیب زدہ"},
    "apparition": {"hi": "प्रेत-छवि / प्रेत-दर्शन", "ar": "طيف / ظهور شبحي", "ur": "سایہ / شبح"},
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

def ai_translate(text: str, target: str, context: dict) -> str:
    base = os.environ.get("AI_BASE_URL", "").rstrip("/")
    key = os.environ.get("AI_API_KEY", "")
    model = os.environ.get("AI_TRANSLATION_MODEL") or os.environ.get("AI_MODEL")
    if not base or not key or not model:
        raise RuntimeError("AI_BASE_URL, AI_API_KEY and AI_TRANSLATION_MODEL/AI_MODEL are required.")

    prompt = f"""You are a literary translator for a source-faithful multilingual story archive.
Translate the source passage into {LANGUAGE_NAMES[target]}.

NON-NEGOTIABLE RULES:
- Translate; do not summarise.
- Preserve every event, action, relationship, uncertainty, warning, supernatural element, and causal connection.
- Preserve paragraph order and do not invent new paragraphs unless required by the target language.
- Preserve character names, place names, numbers, dates, measurements, titles, quoted speech, and narrative point of view.
- Preserve the emotional force without making it more sensational.
- Do not modernise cultural practices in a way that changes their meaning.
- Do not convert folklore into claims of scientific fact.
- Do not add explanations, footnotes, commentary, or a preface.
- If a culturally specific proper noun should remain transliterated, retain a stable transliteration.
- Keep repeated terms consistent across the passage.

SOURCE STORY:
{context.get('title','')}

SOURCE LANGUAGE:
{context.get('language','')}

TARGET LANGUAGE:
{LANGUAGE_NAMES[target]}

GLOSSARY:
{json.dumps({k:v.get(target, k) for k,v in GLOSSARY.items()}, ensure_ascii=False)}

SOURCE PASSAGE:
{text}
"""

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Return only the faithful translation."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
    }
    req = Request(
        base + "/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
    )
    with urlopen(req, timeout=180) as response:
        data = json.loads(response.read().decode("utf-8", errors="replace"))
    return data["choices"][0]["message"]["content"].strip()

def source_path(record: dict) -> Path:
    return TEXT_ROOT / record["language"] / f"{record['id'].lower().replace('_','-')}.txt"

def main() -> None:
    manifest = load_manifest()
    wanted = sys.argv[1:] or [r["id"] for r in manifest["records"]]
    records = {r["id"]: r for r in manifest["records"]}

    for story_id in wanted:
        if story_id not in records:
            raise SystemExit(f"Unknown story id: {story_id}")
        record = records[story_id]
        src = source_path(record)
        if not src.exists():
            print(f"SKIP {story_id}: canonical source not materialized at {src}")
            continue

        source_text = src.read_text(encoding="utf-8").strip()
        source_chunks = chunks(source_text)
        story_out = OUT_ROOT / story_id
        story_out.mkdir(parents=True, exist_ok=True)

        for target in LANGUAGES:
            if target == record["language"]:
                continue
            out = story_out / f"{target}.txt"
            meta = story_out / f"{target}.manifest.json"

            translated_parts = []
            for idx, chunk in enumerate(source_chunks, start=1):
                for attempt in range(3):
                    try:
                        translated_parts.append(ai_translate(chunk, target, record))
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        time.sleep(2 ** attempt)
                print(f"{story_id} -> {target}: chunk {idx}/{len(source_chunks)}")

            translated = "\n\n".join(p.strip() for p in translated_parts if p.strip()).strip() + "\n"
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
                "model": os.environ.get("AI_TRANSLATION_MODEL") or os.environ.get("AI_MODEL"),
                "qualityRule": "Human review is required before publishing."
            }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
