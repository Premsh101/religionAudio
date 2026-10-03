#!/usr/bin/env python3
"""Source-locked multilingual translation for moral tales."""
from __future__ import annotations
import datetime as dt, hashlib, json, os, re, sys, time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/"data/story-corpus/moral-tales/manifest.json"
TEXT_ROOT=ROOT/"data/story-corpus/moral-tales/text"
OUT_ROOT=ROOT/"data/story-corpus/moral-tales/translations"
LANGS=("hi","en","ar","ur")
NAMES={"hi":"Hindi","en":"English","ar":"Arabic","ur":"Urdu"}

GLOSSARY={
 "moral":{"hi":"नैतिक शिक्षा","ar":"العبرة الأخلاقية","ur":"اخلاقی سبق"},
 "wisdom":{"hi":"बुद्धिमत्ता","ar":"الحكمة","ur":"دانائی"},
 "virtue":{"hi":"सद्गुण","ar":"فضيلة","ur":"نیکی"},
 "greed":{"hi":"लालच","ar":"الجشع","ur":"لالچ"},
 "honesty":{"hi":"ईमानदारी","ar":"الصدق","ur":"ایمانداری"},
 "deception":{"hi":"छल / धोखा","ar":"خداع","ur":"فریب"},
 "kindness":{"hi":"दयालुता","ar":"اللطف","ur":"مہربانی"},
 "patience":{"hi":"धैर्य","ar":"الصبر","ur":"صبر"},
 "justice":{"hi":"न्याय","ar":"العدالة","ur":"انصاف"},
 "friendship":{"hi":"मित्रता","ar":"الصداقة","ur":"دوستی"}
}

def sha(s:str)->str:return hashlib.sha256(s.encode("utf-8")).hexdigest()

def chunks(text:str,max_chars:int=9000)->list[str]:
 paras=[p for p in re.split(r"\n\s*\n",text) if p.strip()]
 out=[]; buf=""
 for p in paras:
  if len(buf)+len(p)+2<=max_chars:buf=f"{buf}\n\n{p}".strip()
  else:
   if buf:out.append(buf)
   if len(p)<=max_chars:buf=p
   else:
    ss=re.split(r"(?<=[.!?।؟])\s+",p);buf=""
    for s in ss:
     if len(buf)+len(s)+1<=max_chars:buf=f"{buf} {s}".strip()
     else:
      if buf:out.append(buf)
      buf=s
 if buf:out.append(buf)
 return out

def ai_translate(text:str,target:str,rec:dict)->str:
 base=os.environ.get("AI_BASE_URL","").rstrip("/")
 key=os.environ.get("AI_API_KEY","")
 model=os.environ.get("AI_TRANSLATION_MODEL") or os.environ.get("AI_MODEL")
 if not base or not key or not model:raise RuntimeError("AI_BASE_URL, AI_API_KEY and AI_TRANSLATION_MODEL/AI_MODEL are required.")
 prompt="""You are a literary translator for a moral-tales archive.
Translate the SOURCE PASSAGE into %s.

NON-NEGOTIABLE:
- Translate completely; never summarize, adapt, simplify into a different story, or invent.
- Preserve every event, action, character, relationship, setting, dialogue intention, cultural detail, number and outcome.
- Preserve the exact moral/lesson and how the story arrives at it.
- Preserve uncertainty, allegations and traditional beliefs without changing their status.
- Keep proper names and recurring terms stable.
- Do not add modern explanations, footnotes, moral judgments, or educational commentary.
- Do not replace a culturally specific religious/ethical concept with an unrelated target-culture concept.
- Return ONLY the translation.

Story: %s
Source language: %s
Target language: %s

Glossary:
%s

SOURCE PASSAGE:
%s
"""%(NAMES[target],rec["title"],NAMES[rec["sourceTextLanguage"]],NAMES[target],
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
  if sid not in records:raise SystemExit(f"Unknown story id: {sid}")
  rec=records[sid]; src=TEXT_ROOT/rec["language"]/f"{sid}.txt"
  if not src.exists():
   print(f"SKIP {sid}: source not found");continue
  source=src.read_text(encoding="utf-8").strip(); source_chunks=chunks(source)
  out_dir=OUT_ROOT/sid;out_dir.mkdir(parents=True,exist_ok=True)
  for target in LANGS:
   if target==rec["language"]:continue
   parts=[]
   for i,chunk in enumerate(source_chunks,1):
    for attempt in range(3):
     try:parts.append(ai_translate(chunk,target,rec));break
     except Exception:
      if attempt==2:raise
      time.sleep(2**attempt)
    print(f"{sid} -> {target}: chunk {i}/{len(source_chunks)}")
   translated="\n\n".join(x for x in parts if x.strip()).strip()+"\n"
   (out_dir/f"{target}.txt").write_text(translated,encoding="utf-8")
   (out_dir/f"{target}.manifest.json").write_text(json.dumps({
    "storyId":sid,"sourceLanguage":rec["language"],"targetLanguage":target,
    "sourceSha256":sha(source),"translationSha256":sha(translated),
    "sourceCharacters":len(source),"translationCharacters":len(translated),
    "chunkCount":len(source_chunks),"generatedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
    "method":"source-locked faithful translation via OpenAI-compatible endpoint",
    "qualityRule":"Human editorial review required before publication."
   },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
if __name__=="__main__":main()
