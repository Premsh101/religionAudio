#!/usr/bin/env python3
"""Source-locked multilingual translation for mythology stories."""
from __future__ import annotations
import datetime as dt, hashlib, json, os, re, sys, time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/"data/story-corpus/mythology/manifest.json"
TEXT_ROOT=ROOT/"data/story-corpus/mythology/text"
OUT_ROOT=ROOT/"data/story-corpus/mythology/translations"
LANGS=("hi","en","ar","ur")
NAMES={"hi":"Hindi","en":"English","ar":"Arabic","ur":"Urdu"}

GLOSSARY={
 "god":{"hi":"देवता","ar":"إله","ur":"دیوتا"},
 "goddess":{"hi":"देवी","ar":"إلهة","ur":"دیوی"},
 "hero":{"hi":"नायक","ar":"بطل","ur":"ہیرو"},
 "myth":{"hi":"पौराणिक कथा","ar":"أسطورة","ur":"اساطیری داستان"},
 "deity":{"hi":"देवता","ar":"معبود","ur":"معبود"},
 "ritual":{"hi":"अनुष्ठान","ar":"طقس","ur":"رسم"},
 "fate":{"hi":"भाग्य","ar":"قدر","ur":"تقدیر"},
 "underworld":{"hi":"पाताल / अधोलोक","ar":"العالم السفلي","ur":"عالمِ زیرین"},
 "creation":{"hi":"सृष्टि","ar":"الخلق","ur":"تخلیق"},
 "prophecy":{"hi":"भविष्यवाणी","ar":"نبوءة","ur":"پیش گوئی"}
}

def sha256(s:str)->str: return hashlib.sha256(s.encode("utf-8")).hexdigest()

def chunks(text:str,max_chars:int=9000)->list[str]:
 paras=[p for p in re.split(r"\n\s*\n",text) if p.strip()]
 out=[]; buf=""
 for p in paras:
  if len(buf)+len(p)+2<=max_chars: buf=f"{buf}\n\n{p}".strip()
  else:
   if buf: out.append(buf)
   if len(p)<=max_chars: buf=p
   else:
    parts=re.split(r"(?<=[.!?।؟])\s+",p); buf=""
    for s in parts:
     if len(buf)+len(s)+1<=max_chars: buf=f"{buf} {s}".strip()
     else:
      if buf: out.append(buf)
      buf=s
 if buf: out.append(buf)
 return out

def ai_translate(text:str,target:str,rec:dict)->str:
 base=os.environ.get("AI_BASE_URL","").rstrip("/")
 key=os.environ.get("AI_API_KEY","")
 model=os.environ.get("AI_TRANSLATION_MODEL") or os.environ.get("AI_MODEL")
 if not base or not key or not model: raise RuntimeError("AI_BASE_URL, AI_API_KEY and AI_TRANSLATION_MODEL/AI_MODEL are required.")
 prompt="""You are a literary translator for a world mythology archive.
Translate the source passage into %s.

Rules:
- Translate completely; never summarize, adapt, sanitize, or add.
- Preserve every event, action, genealogy, relationship, name, place, object, number, dialogue, uncertainty and outcome.
- Preserve the order of revelations and narrative perspective.
- Preserve culturally specific divine, ritual, cosmological and mythic concepts without replacing them with unrelated modern concepts.
- Do not turn myth, sacred tradition, folklore, literary interpretation or supernatural events into scientific fact.
- Do not add commentary, footnotes, moral judgments or explanations.
- Keep names and recurring terms consistent across the whole work.
- Return ONLY the translation.

Story: %s
Source language: %s
Target language: %s

Glossary:
%s

Source passage:
%s
"""%(NAMES[target],rec["title"],NAMES[rec["language"]],NAMES[target],
     json.dumps({k:v.get(target,k) for k,v in GLOSSARY.items()},ensure_ascii=False),text)
 payload={"model":model,"messages":[{"role":"system","content":"Return only the faithful literary translation."},{"role":"user","content":prompt}],"temperature":0.1}
 req=Request(base+"/chat/completions",data=json.dumps(payload,ensure_ascii=False).encode("utf-8"),
             headers={"Content-Type":"application/json","Authorization":"Bearer "+key})
 with urlopen(req,timeout=240) as response:
  data=json.loads(response.read().decode("utf-8",errors="replace"))
 return data["choices"][0]["message"]["content"].strip()

def main()->None:
 records={r["id"]:r for r in json.loads(MANIFEST.read_text(encoding="utf-8"))["records"]}
 wanted=sys.argv[1:] or list(records)
 for sid in wanted:
  if sid not in records: raise SystemExit(f"Unknown story id: {sid}")
  rec=records[sid]
  src=TEXT_ROOT/rec["language"]/f"{sid}.txt"
  if not src.exists():
   print(f"SKIP {sid}: canonical source not found at {src}"); continue
  source=src.read_text(encoding="utf-8").strip()
  source_chunks=chunks(source)
  out_dir=OUT_ROOT/sid; out_dir.mkdir(parents=True,exist_ok=True)
  for target in LANGS:
   if target==rec["language"]: continue
   parts=[]
   for i,chunk in enumerate(source_chunks,1):
    for attempt in range(3):
     try: parts.append(ai_translate(chunk,target,rec)); break
     except Exception:
      if attempt==2: raise
      time.sleep(2**attempt)
    print(f"{sid} -> {target}: chunk {i}/{len(source_chunks)}")
   translated="\n\n".join(p for p in parts if p.strip()).strip()+"\n"
   (out_dir/f"{target}.txt").write_text(translated,encoding="utf-8")
   (out_dir/f"{target}.manifest.json").write_text(json.dumps({
    "storyId":sid,"sourceLanguage":rec["language"],"targetLanguage":target,
    "sourceSha256":sha256(source),"translationSha256":sha256(translated),
    "sourceCharacters":len(source),"translationCharacters":len(translated),
    "chunkCount":len(source_chunks),"generatedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
    "method":"source-locked faithful translation via OpenAI-compatible endpoint",
    "qualityRule":"Human editorial review required before publication."
   },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

if __name__=="__main__": main()
