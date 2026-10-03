#!/usr/bin/env python3
"""Source-locked multilingual translation for the thriller corpus."""
from __future__ import annotations
import datetime as dt, hashlib, json, os, re, sys, time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/"data/story-corpus/thriller/manifest.json"
TEXT_ROOT=ROOT/"data/story-corpus/thriller/text"
OUT_ROOT=ROOT/"data/story-corpus/thriller/translations"
LANGS=("hi","en","ar","ur")
NAMES={"hi":"Hindi","en":"English","ar":"Arabic","ur":"Urdu"}

GLOSSARY={
 "thriller":{"hi":"रोमांचक कथा","ar":"قصة تشويق","ur":"تھرلر کہانی"},
 "suspense":{"hi":"रोमांच और रहस्य","ar":"التشويق","ur":"تجسس و سنسنی"},
 "conspiracy":{"hi":"षड्यंत्र","ar":"مؤامرة","ur":"سازش"},
 "escape":{"hi":"भाग निकलना","ar":"هروب","ur":"فرار"},
 "clue":{"hi":"सुराग","ar":"دليل","ur":"سراغ"},
 "mystery":{"hi":"रहस्य","ar":"لغز","ur":"معمہ"},
 "threat":{"hi":"धमकी","ar":"تهديد","ur":"دھمکی"}
}

def sha256(text:str)->str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def chunks(text:str,max_chars:int=9000)->list[str]:
    paras=[p for p in re.split(r"\n\s*\n",text) if p.strip()]
    out=[]; buf=""
    for p in paras:
        if len(buf)+len(p)+2<=max_chars:
            buf=f"{buf}\n\n{p}".strip()
        else:
            if buf: out.append(buf)
            if len(p)<=max_chars: buf=p
            else:
                sentences=re.split(r"(?<=[.!?।؟])\s+",p)
                buf=""
                for s in sentences:
                    if len(buf)+len(s)+1<=max_chars:
                        buf=f"{buf} {s}".strip()
                    else:
                        if buf: out.append(buf)
                        buf=s
    if buf: out.append(buf)
    return out

def ai_translate(text:str,target:str,record:dict)->str:
    base=os.environ.get("AI_BASE_URL","").rstrip("/")
    key=os.environ.get("AI_API_KEY","")
    model=os.environ.get("AI_TRANSLATION_MODEL") or os.environ.get("AI_MODEL")
    if not base or not key or not model:
        raise RuntimeError("AI_BASE_URL, AI_API_KEY and AI_TRANSLATION_MODEL/AI_MODEL are required.")
    prompt=f"""You are a literary translator for a multilingual thriller archive.
Translate the SOURCE PASSAGE into {NAMES[target]}.

NON-NEGOTIABLE RULES:
- Translate; do not summarize or adapt.
- Preserve every event, threat, escape, clue, action, relationship, revelation and consequence.
- Preserve suspense pacing and reveal order.
- Preserve names, places, dates, numbers, measurements, objects, chapter/section order and dialogue intent.
- Preserve point of view, uncertainty, suspicion and whether something is fact, rumor, hypothesis, hallucination or fiction.
- Preserve historical legal, military, social and cultural concepts instead of replacing them with modern equivalents.
- Preserve supernatural/fantastical elements without turning them into scientific claims.
- Do not add graphic detail, explanations, moral commentary or footnotes.
- Keep recurring names and terms stable.
- Return ONLY the translation.

STORY: {record["title"]}
SOURCE LANGUAGE: {NAMES[record["language"]]}
TARGET LANGUAGE: {NAMES[target]}

GLOSSARY:
{json.dumps({k:v.get(target,k) for k,v in GLOSSARY.items()},ensure_ascii=False)}

SOURCE PASSAGE:
{text}
"""
    payload={"model":model,"messages":[
      {"role":"system","content":"Return only the faithful literary translation."},
      {"role":"user","content":prompt}
    ],"temperature":0.1}
    req=Request(base+"/chat/completions",data=json.dumps(payload,ensure_ascii=False).encode("utf-8"),
      headers={"Content-Type":"application/json","Authorization":"Bearer "+key})
    with urlopen(req,timeout=240) as response:
        data=json.loads(response.read().decode("utf-8",errors="replace"))
    return data["choices"][0]["message"]["content"].strip()

def main()->None:
    records={r["id"]:r for r in json.loads(MANIFEST.read_text(encoding="utf-8"))["records"]}
    wanted=sys.argv[1:] or list(records)
    for story_id in wanted:
        if story_id not in records: raise SystemExit(f"Unknown story id: {story_id}")
        rec=records[story_id]
        src=TEXT_ROOT/rec["language"]/f"{story_id}.txt"
        if not src.exists():
            print(f"SKIP {story_id}: canonical source not found at {src}")
            continue
        source=src.read_text(encoding="utf-8").strip()
        out_dir=OUT_ROOT/story_id
        out_dir.mkdir(parents=True,exist_ok=True)
        for target in LANGS:
            if target==rec["language"]: continue
            parts=[]
            for idx,chunk in enumerate(chunks(source),1):
                for attempt in range(3):
                    try:
                        parts.append(ai_translate(chunk,target,rec)); break
                    except Exception:
                        if attempt==2: raise
                        time.sleep(2**attempt)
                print(f"{story_id} -> {target}: chunk {idx}")
            translated="\n\n".join(p for p in parts if p.strip()).strip()+"\n"
            (out_dir/f"{target}.txt").write_text(translated,encoding="utf-8")
            (out_dir/f"{target}.manifest.json").write_text(json.dumps({
              "storyId":story_id,"sourceLanguage":rec["language"],"targetLanguage":target,
              "sourceSha256":sha256(source),"translationSha256":sha256(translated),
              "sourceCharacters":len(source),"translationCharacters":len(translated),
              "chunkCount":len(chunks(source)),
              "generatedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
              "method":"source-locked faithful translation via OpenAI-compatible endpoint",
              "qualityRule":"Human review is required before publication."
            },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

if __name__=="__main__":
    main()
