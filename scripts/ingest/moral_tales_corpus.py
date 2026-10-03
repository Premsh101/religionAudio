#!/usr/bin/env python3
"""Rights-aware source materializer for moral tales and fables."""
from __future__ import annotations
import datetime as dt, hashlib, json, re, sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/"data/story-corpus/moral-tales/manifest.json"
TEXT_ROOT=ROOT/"data/story-corpus/moral-tales/text"

SOURCES={
 "hitopadesha":("https://www.gutenberg.org/cache/epub/13268/pg13268.txt","Hindu literature / The Book of Good Counsels"),
 "more-jataka":("https://www.gutenberg.org/cache/epub/7518/pg7518.txt","More Jataka Tales"),
 "oriental-tales":("https://www.gutenberg.org/cache/epub/62868/pg62868.txt","Oriental tales, for the entertainment of youth"),
 "thousand-one-days":("https://www.gutenberg.org/cache/epub/36301/pg36301.txt","The Thousand and One Days")
}

def sha(b:bytes)->str:return hashlib.sha256(b).hexdigest()
def norm(s:str)->str:return re.sub(r"[^a-z0-9]+"," ",s.lower()).strip()

def clean(text:str)->str:
 text=text.replace("\r\n","\n").replace("\r","\n")
 text=re.sub(r"(?s)^.*?\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\n","",text,count=1)
 text=re.sub(r"(?s)\n\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$","",text,count=1)
 return text.strip()

def extract(text:str,title:str)->str:
 lines=text.splitlines(); wanted=norm(title); matches=[]
 for i,line in enumerate(lines):
  if norm(line)==wanted: matches.append(i)
 if not matches:
  raise ValueError(f"Source heading not found: {title}")
 start=matches[0]; end=len(lines)
 for i in range(start+1,len(lines)):
  s=lines[i].strip()
  if s and len(s)<=100 and s==s.upper() and re.search(r"[A-Z]",s):
   end=i; break
 story="\n".join(lines[start:end]).strip()
 if len(story)<250: raise ValueError(f"Extracted text too short for {title}")
 return story

def fetch(url:str)->bytes:
 req=Request(url,headers={"User-Agent":"religionAudio moral-tales corpus ingester/1.0"})
 with urlopen(req,timeout=90) as r:return r.read()

def main()->None:
 records={r["id"]:r for r in json.loads(MANIFEST.read_text(encoding="utf-8"))["records"]}
 wanted=sys.argv[1:] or list(records)
 for sid in wanted:
  if sid not in records:raise SystemExit(f"Unknown story id: {sid}")
  rec=records[sid]; key=rec["source"]["sourceKey"]
  url,collection=SOURCES[key]
  raw=fetch(url); story=extract(clean(raw.decode("utf-8",errors="replace")),rec["source"]["sourceSection"])
  out=TEXT_ROOT/rec["language"]; out.mkdir(parents=True,exist_ok=True)
  (out/f"{sid}.txt").write_text(story+"\n",encoding="utf-8")
  (out/f"{sid}.manifest.json").write_text(json.dumps({
   "storyId":sid,"sourceUrl":url,"collection":collection,"sourceSection":rec["source"]["sourceSection"],
   "retrievedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
   "sourceSha256":sha(raw),"materializedSha256":sha(story.encode("utf-8")),
   "sourceTextLanguage":rec["sourceTextLanguage"],
   "originalLanguage":rec["originalLanguage"],
   "rightsNote":"Project Gutenberg public-domain status is jurisdiction-specific; verify commercial target markets."
  },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  print(f"MATERIALIZED {sid}")
if __name__=="__main__":main()
