#!/usr/bin/env python3
"""Semantic QA for source-locked children's translations."""
from __future__ import annotations
import json, os, re, sys, time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/"data/story-corpus/children/manifest.json"
TEXT_ROOT=ROOT/"data/story-corpus/children/text"
TRANS_ROOT=ROOT/"data/story-corpus/children/translations"
LANGS=("hi","en","ar","ur")
NAMES={"hi":"Hindi","en":"English","ar":"Arabic","ur":"Urdu"}

def chunks(text:str,max_chars:int=8000)->list[str]:
    paras=[p.strip() for p in re.split(r"\n\s*\n",text) if p.strip()]
    out=[]; buf=""
    for p in paras:
        if len(buf)+len(p)+2<=max_chars: buf=f"{buf}\n\n{p}".strip()
        else:
            if buf: out.append(buf)
            buf=p
    if buf: out.append(buf)
    return out

def ai_check(source:str,translation:str,target:str,story:dict)->dict:
    base=os.environ.get("AI_BASE_URL","").rstrip("/")
    key=os.environ.get("AI_API_KEY","")
    model=os.environ.get("AI_TRANSLATION_MODEL") or os.environ.get("AI_MODEL")
    if not base or not key or not model:
        raise RuntimeError("AI_BASE_URL, AI_API_KEY and AI_TRANSLATION_MODEL/AI_MODEL are required.")
    prompt="""Audit this %s translation against the source passage.

Story: %s

Check strictly:
- no omitted or added events, character actions, relationships, settings, lessons or outcomes;
- names, numbers, dates, objects and sequence are preserved;
- dialogue intent and point of view are preserved;
- cultural, religious and historical details are preserved;
- fantasy, folklore and talking-animal elements are not turned into factual scientific claims;
- the text is translated, not summarized or simplified into a different story.

Return only a JSON object with verdict, omissions, additions, entityIssues, numberIssues and meaningIssues.

SOURCE:
%s

TRANSLATION:
%s
""" % (NAMES[target],story["title"],source,translation)
    payload={"model":model,"messages":[
      {"role":"system","content":"Return only valid JSON."},
      {"role":"user","content":prompt}
    ],"temperature":0.0}
    req=Request(base+"/chat/completions",data=json.dumps(payload,ensure_ascii=False).encode("utf-8"),
      headers={"Content-Type":"application/json","Authorization":"Bearer "+key})
    with urlopen(req,timeout=240) as response:
        data=json.loads(response.read().decode("utf-8",errors="replace"))
    raw=data["choices"][0]["message"]["content"].strip()
    raw=raw.replace(chr(96),"").strip()
    if raw.lower().startswith("json"):
        raw=raw[4:].strip()
    return json.loads(raw)

def nums(text:str)->list[str]:
    return sorted(re.findall(r"\b\d+(?:[.,]\d+)?\b",text))

def main()->None:
    records={r["id"]:r for r in json.loads(MANIFEST.read_text(encoding="utf-8"))["records"]}
    if len(sys.argv)<2: raise SystemExit("Usage: verify_children_translations.py STORY_ID [hi] [en] [ar] [ur]")
    sid=sys.argv[1]
    if sid not in records: raise SystemExit(f"Unknown story id: {sid}")
    story=records[sid]
    src_path=TEXT_ROOT/story["language"]/f"{sid}.txt"
    if not src_path.exists(): raise SystemExit(f"Canonical source file not found: {src_path}")
    source=src_path.read_text(encoding="utf-8").strip()
    requested=sys.argv[2:] or list(LANGS)
    out_dir=TRANS_ROOT/sid
    out_dir.mkdir(parents=True,exist_ok=True)
    overall={}
    for target in requested:
        if target==story["language"]: continue
        path=out_dir/f"{target}.txt"
        if not path.exists():
            overall[target]={"verdict":"MISSING","issues":["Translation file does not exist."]}
            continue
        translation=path.read_text(encoding="utf-8").strip()
        results=[]
        for i,chunk in enumerate(chunks(source),1):
            for attempt in range(3):
                try:
                    results.append(ai_check(chunk,translation,target,story)); break
                except Exception:
                    if attempt==2: raise
                    time.sleep(2**attempt)
            print(f"{sid} [{target}] QA {i}")
        merged={"verdict":"PASS" if all(r.get("verdict")=="PASS" for r in results) else "REVIEW",
                "chunks":results,"sourceNumbers":nums(source),"translationNumbers":nums(translation)}
        if merged["sourceNumbers"]!=merged["translationNumbers"]:
            merged["verdict"]="REVIEW"
            merged["numberIssues"]=["Numeric tokens differ; inspect dates, quantities and numbering."]
        (out_dir/f"{target}.qa.json").write_text(json.dumps(merged,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        overall[target]=merged
    print(json.dumps(overall,ensure_ascii=False,indent=2))
    if any(v.get("verdict") in {"REVIEW","MISSING"} for v in overall.values()): raise SystemExit(2)

if __name__=="__main__":
    main()
