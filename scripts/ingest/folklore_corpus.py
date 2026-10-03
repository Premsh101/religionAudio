#!/usr/bin/env python3
"""Rights-aware source materializer for folklore sources."""
from __future__ import annotations
import datetime as dt, hashlib, json, re, sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/"data/story-corpus/folklore/manifest.json"
TEXT_ROOT=ROOT/"data/story-corpus/folklore/text"

PG={
 "india":("https://www.gutenberg.org/cache/epub/7128/pg7128.txt","Indian Fairy Tales"),
 "bengal":("https://www.gutenberg.org/cache/epub/38488/pg38488.txt","Folk-Tales of Bengal"),
 "english":("https://www.gutenberg.org/cache/epub/7439/pg7439.txt","English Fairy Tales"),
 "irish":("https://www.gutenberg.org/cache/epub/2892/pg2892.txt","Irish Fairy Tales"),
 "japan":("https://www.gutenberg.org/cache/epub/4018/pg4018.txt","Japanese Fairy Tales"),
 "russia-polevoi":("https://www.gutenberg.org/cache/epub/34705/pg34705.txt","Russian Fairy Tales from the Skazki of Polevoi"),
 "china":("https://www.gutenberg.org/cache/epub/29939/pg29939.txt","The Chinese Fairy Book"),
 "west-africa":("https://www.gutenberg.org/cache/epub/66923/pg66923.txt","West African Folk-Tales"),
 "south-africa":("https://www.gutenberg.org/cache/epub/38339/pg38339.txt","South-African Folk-Tales")
}

def sha256(b:bytes)->str: return hashlib.sha256(b).hexdigest()

def clean(text:str)->str:
 text=text.replace("\r\n","\n").replace("\r","\n")
 text=re.sub(r"(?s)^.*?\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\n","",text,count=1)
 text=re.sub(r"(?s)\n\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$","",text,count=1)
 return text.strip()

def normalize(s:str)->str:
 return re.sub(r"[^a-z0-9]+"," ",s.lower()).strip()

def extract(text:str,title:str,collection:str)->str:
 lines=text.splitlines(); wanted=normalize(title)
 matches=[]
 for i,line in enumerate(lines):
  if normalize(line)==wanted: matches.append(i)
 if not matches:
  raise ValueError(f"Heading not found for {title} in {collection}")
 start=matches[0]
 end=len(lines)
 for i in range(start+1,len(lines)):
  s=lines[i].strip()
  n=normalize(s)
  if n and len(s)<=100 and s==s.upper() and re.search(r"[A-Z]",s):
   end=i
 story="\n".join(lines[start:end]).strip()
 if len(story)<250: raise ValueError(f"Extracted text too short for {title}")
 return story

def fetch(url:str)->bytes:
 req=Request(url,headers={"User-Agent":"religionAudio folklore corpus ingester/1.0"})
 with urlopen(req,timeout=90) as r: return r.read()

def main()->None:
 manifest=json.loads(MANIFEST.read_text(encoding="utf-8"))
 records={x["id"]:x for x in manifest["records"]}
 wanted=sys.argv[1:] or list(records)
 for sid in wanted:
  if sid not in records: raise SystemExit(f"Unknown story id: {sid}")
  rec=records[sid]
  if rec.get("ingest")!="project-gutenberg-extract":
   print(f"CATALOG_ONLY {sid}: source requires edition review"); continue
  src_key=rec["source"]["sourceKey"]
  url,collection=PG[src_key]
  raw=fetch(url); text=clean(raw.decode("utf-8",errors="replace"))
  story=extract(text,rec["source"]["sourceStoryTitle"],collection)
  out_dir=TEXT_ROOT/rec["language"]; out_dir.mkdir(parents=True,exist_ok=True)
  (out_dir/f"{sid}.txt").write_text(story+"\n",encoding="utf-8")
  (out_dir/f"{sid}.manifest.json").write_text(json.dumps({
   "storyId":sid,"sourceUrl":url,"collection":collection,
   "sourceStoryTitle":rec["source"]["sourceStoryTitle"],
   "retrievedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
   "sourceSha256":sha256(raw),"materializedSha256":sha256(story.encode("utf-8")),
   "rightsNote":"Project Gutenberg public-domain status is jurisdiction-specific; verify commercial target markets before redistribution."
  },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  print(f"MATERIALIZED {sid}")
if __name__=="__main__": main()
