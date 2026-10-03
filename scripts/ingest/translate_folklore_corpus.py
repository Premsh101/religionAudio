#!/usr/bin/env python3
"""Source-locked multilingual translation for folklore stories."""
from __future__ import annotations
import datetime as dt, hashlib, json, os, re, sys, time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/"data/story-corpus/folklore/manifest.json"
TEXT_ROOT=ROOT/"data/story-corpus/folklore/text"
OUT_ROOT=ROOT/"data/story-corpus/folklore/translations"
LANGS=("hi","en","ar","ur")
NAMES={"hi":"Hindi","en":"English","ar":"Arabic","ur":"Urdu"}

GLOSSARY={
 "folklore":{"hi":"लोककथा","ar":"فولكلور","ur":"لوک کہانی"},
 "legend":{"hi":"किंवदंती","ar":"أسطورة شعبية","ur":"روایتی داستان"},
 "fairy":{"hi":"परी","ar":"جنية","ur":"پری"},
 "trickster":{"hi":"चतुर चालबाज़","ar":"مخادع","ur":"چالاک فریب کار"},
 "spirit":{"hi":"आत्मा / प्रेत","ar":"روح","ur":"روح"},
 "curse":{"hi":"शाप","ar":"لعنة","ur":"بددعا / لعنت"},
 "blessing":{"hi":"आशीर्वाद","ar":"بركة","ur":"برکت"},
 "king":{"hi":"राजा","ar":"ملك","ur":"بادشاہ"},
 "queen":{"hi":"रानी","ar":"ملكة","ur":"ملکہ"},
 "giant":{"hi":"दानव / विशालकाय","ar":"عملاق","ur":"دیو"}
}

def sha256(s:str)->str:
 return hashlib.sha256(s.encode("utf-8")).hexdigest()

def chunks(text:str,max_chars:int=9000)->list[str]:
 paras=[p for p in re.split(r"\n\s*\n",text) if p.strip()]
 out=[]; buf=""
 for p in paras:
  if len(buf)+len(p)+2<=max_chars: buf=f"{buf}\n\n{p}".strip()
  else:
   if buf: out.append(buf)
   if len(p)<=max_chars: buf=p
   else:
    sentences=re.split(r"(?<=[.!?।؟])\s+",p); buf=""
    for s in sentences:
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
 prompt="""You are a literary translator for a world folklore and legends archive.
Translate the source passage into %s.

NON-NEGOTIABLE RULES:
- Translate completely. Never summarize, shorten, combine tales, or invent content.
- Preserve every event, action, character, relationship, place, object, number, dialogue, cultural detail, uncertainty and outcome.
- Preserve the reveal/order of the original story.
- Preserve traditional names and culturally specific concepts; use stable transliteration where useful.
- Do not replace a local spirit, creature, ritual or belief with a different concept from the target culture.
- Do not turn folklore, legend, magic or supernatural claims into scientific facts.
- Do not add explanations, moral commentary, footnotes or modern context.
- Keep recurring terms and names consistent.
- Return only the translation.

Story: %s
Source language: %s
Target language: %s

Glossary:
%s

SOURCE PASSAGE:
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
  source=src.read_text(encoding="utf-8").strip(); source_chunks=chunks(source)
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
   translated="\n\n".join(x for x in parts if x.strip()).strip()+"\n"
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
