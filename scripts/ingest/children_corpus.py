#!/usr/bin/env python3
"""Rights-aware source materializer for the children corpus."""
from __future__ import annotations
import datetime as dt, hashlib, json, re, sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/"data/story-corpus/children/manifest.json"
TEXT_ROOT=ROOT/"data/story-corpus/children/text"

PROJECT_GUTENBERG={
 "children-en-alice":("https://www.gutenberg.org/cache/epub/928/pg928.txt","ALICE'S ADVENTURES IN WONDERLAND"),
 "children-en-wizard-oz":("https://www.gutenberg.org/cache/epub/43936/pg43936.txt","THE WONDERFUL WIZARD OF OZ"),
 "children-en-jungle-book":("https://www.gutenberg.org/cache/epub/236/pg236.txt","THE JUNGLE BOOK"),
 "children-en-just-so":("https://www.gutenberg.org/cache/epub/2781/pg2781.txt","JUST SO STORIES"),
 "children-en-wind-willows":("https://www.gutenberg.org/cache/epub/27805/pg27805.txt","THE WIND IN THE WILLOWS"),
 "children-en-peter-pan":("https://www.gutenberg.org/cache/epub/16/pg16.txt","PETER PAN"),
 "children-en-secret-garden":("https://www.gutenberg.org/cache/epub/113/pg113.txt","THE SECRET GARDEN"),
 "children-en-little-princess":("https://www.gutenberg.org/cache/epub/146/pg146.txt","A LITTLE PRINCESS"),
 "children-en-aesop":("https://www.gutenberg.org/cache/epub/19994/pg19994.txt","THE AESOP FOR CHILDREN"),
 "children-en-grimm":("https://www.gutenberg.org/cache/epub/5314/pg5314.txt","HOUSEHOLD TALES BY BROTHERS GRIMM")
}

def sha256(data:bytes)->str:
    return hashlib.sha256(data).hexdigest()

def clean_pg(text:str)->str:
    text=text.replace("\r\n","\n").replace("\r","\n")
    text=re.sub(r"(?s)^.*?\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\n","",text,count=1)
    text=re.sub(r"(?s)\n\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$","",text,count=1)
    return text.strip()

def extract(text:str,heading:str)->str:
    lines=text.splitlines()
    norm=re.sub(r"[^a-z0-9]+"," ",heading.lower()).strip()
    matches=[]
    for i,line in enumerate(lines):
        cand=re.sub(r"[^a-z0-9]+"," ",line.lower()).strip()
        if cand==norm: matches.append(i)
    if not matches:
        raise ValueError(f"Story heading not found: {heading}")
    start=matches[0]
    story="\n".join(lines[start:]).strip()
    if len(story)<500:
        raise ValueError(f"Source unexpectedly short: {heading}")
    return story

def fetch(url:str)->bytes:
    req=Request(url,headers={"User-Agent":"religionAudio children corpus ingester/1.0"})
    with urlopen(req,timeout=90) as response:
        return response.read()

def materialize(story_id:str,lang:str,url:str,heading:str)->None:
    raw=fetch(url)
    story=extract(clean_pg(raw.decode("utf-8",errors="replace")),heading)
    out_dir=TEXT_ROOT/lang
    out_dir.mkdir(parents=True,exist_ok=True)
    out=out_dir/f"{story_id}.txt"
    out.write_text(story+"\n",encoding="utf-8")
    (out_dir/f"{story_id}.manifest.json").write_text(json.dumps({
      "storyId":story_id,"sourceUrl":url,"sourceHeading":heading,
      "retrievedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
      "sourceSha256":sha256(raw),"materializedSha256":sha256(story.encode("utf-8")),
      "method":"Project Gutenberg plain-text source",
      "rightsNote":"Project Gutenberg public-domain status is primarily USA-facing; confirm target-jurisdiction status before commercial redistribution."
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"MATERIALIZED {story_id} -> {out}")

def main()->None:
    records={r["id"]:r for r in json.loads(MANIFEST.read_text(encoding="utf-8"))["records"]}
    wanted=sys.argv[1:] or list(records)
    for sid in wanted:
        if sid not in records: raise SystemExit(f"Unknown story id: {sid}")
        rec=records[sid]
        if sid in PROJECT_GUTENBERG:
            url,heading=PROJECT_GUTENBERG[sid]
            materialize(sid,rec["language"],url,heading)
        else:
            source=rec.get("source",{})
            print(f"CATALOG_ONLY {sid}: exact open source/edition requires verification ({source.get('url','no-url')})")

if __name__=="__main__":
    main()
