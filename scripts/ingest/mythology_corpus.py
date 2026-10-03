#!/usr/bin/env python3
"""Rights-aware source materializer for mythology sources."""
from __future__ import annotations
import datetime as dt, hashlib, json, re, sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/"data/story-corpus/mythology/manifest.json"
TEXT_ROOT=ROOT/"data/story-corpus/mythology/text"

PG={
 "myth-en-prometheus-pandora":("https://www.gutenberg.org/cache/epub/4928/pg4928.txt","STORY OF GODS AND HEROES"),
 "myth-en-apollo-daphne":("https://www.gutenberg.org/cache/epub/4928/pg4928.txt","STORY OF GODS AND HEROES"),
 "myth-en-midas":("https://www.gutenberg.org/cache/epub/4928/pg4928.txt","STORY OF GODS AND HEROES"),
 "myth-en-cupid-psyche":("https://www.gutenberg.org/cache/epub/4928/pg4928.txt","STORY OF GODS AND HEROES"),
 "myth-en-perseus-medusa":("https://www.gutenberg.org/cache/epub/4928/pg4928.txt","STORY OF GODS AND HEROES"),
 "myth-en-golden-fleece":("https://www.gutenberg.org/cache/epub/4928/pg4928.txt","STORY OF GODS AND HEROES"),
 "myth-en-hercules":("https://www.gutenberg.org/cache/epub/4928/pg4928.txt","STORY OF GODS AND HEROES"),
 "myth-en-orpheus-eurydice":("https://www.gutenberg.org/cache/epub/4928/pg4928.txt","STORY OF GODS AND HEROES"),
 "myth-en-ulysses-cyclopes":("https://www.gutenberg.org/cache/epub/4928/pg4928.txt","STORY OF GODS AND HEROES"),
 "myth-en-odin-creation":("https://www.gutenberg.org/cache/epub/28497/pg28497.txt","MYTHS OF THE NORSEMEN"),
 "myth-en-thor":("https://www.gutenberg.org/cache/epub/28497/pg28497.txt","MYTHS OF THE NORSEMEN"),
 "myth-en-baldur":("https://www.gutenberg.org/cache/epub/28497/pg28497.txt","MYTHS OF THE NORSEMEN"),
 "myth-en-loki":("https://www.gutenberg.org/cache/epub/28497/pg28497.txt","MYTHS OF THE NORSEMEN"),
 "myth-en-ragnarok":("https://www.gutenberg.org/cache/epub/28497/pg28497.txt","MYTHS OF THE NORSEMEN"),
 "myth-en-ra-creation":("https://www.gutenberg.org/cache/epub/9411/pg9411.txt","CHAPTER I"),
 "myth-en-destruction-mankind":("https://www.gutenberg.org/cache/epub/9411/pg9411.txt","CHAPTER II"),
 "myth-en-ra-snakebite":("https://www.gutenberg.org/cache/epub/9411/pg9411.txt","CHAPTER III"),
 "myth-en-horus-winged-disk":("https://www.gutenberg.org/cache/epub/9411/pg9411.txt","CHAPTER IV"),
 "myth-en-origin-horus":("https://www.gutenberg.org/cache/epub/9411/pg9411.txt","CHAPTER V"),
 "myth-en-isis-osiris":("https://www.gutenberg.org/cache/epub/9411/pg9411.txt","CHAPTER IX"),
 "myth-en-gita-krishna-arjuna":("https://www.gutenberg.org/cache/epub/2388/pg2388.txt","BHAGAVAD-GÎTÂ"),
 "myth-en-savitri-satyavan":("https://www.gutenberg.org/cache/epub/7864/pg7864.txt","MAHABHARATA"),
 "myth-en-nala-damayanti":("https://www.gutenberg.org/cache/epub/7864/pg7864.txt","MAHABHARATA"),
 "myth-en-draupadi-swayamvara":("https://www.gutenberg.org/cache/epub/7864/pg7864.txt","MAHABHARATA"),
 "myth-en-jataka-monkey-crocodile":("https://www.gutenberg.org/cache/epub/62514/pg62514.txt","JATAKA TALES"),
 "myth-en-jataka-banyan-deer":("https://www.gutenberg.org/cache/epub/62514/pg62514.txt","JATAKA TALES"),
 "myth-en-lady-fountain":("https://www.gutenberg.org/cache/epub/5160/pg5160.txt","THE MABINOGION"),
 "myth-en-branwen":("https://www.gutenberg.org/cache/epub/5160/pg5160.txt","THE MABINOGION"),
 "myth-en-kalevala-sampo":("https://www.gutenberg.org/cache/epub/7000/pg7000.txt","KALEVALA"),
 "myth-en-kalevala-creation":("https://www.gutenberg.org/cache/epub/7000/pg7000.txt","KALEVALA")
}

def clean(text:str)->str:
 text=text.replace("\\r\\n","\\n").replace("\\r","\\n")
 text=re.sub(r"(?s)^.*?\\*\\*\\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\\n","",text,count=1)
 text=re.sub(r"(?s)\\n\\*\\*\\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$","",text,count=1)
 return text.strip()

def fetch(url:str)->bytes:
 req=Request(url,headers={"User-Agent":"religionAudio mythology corpus ingester/1.0"})
 with urlopen(req,timeout=90) as r: return r.read()

def save(sid:str,lang:str,url:str,raw:bytes)->None:
 text=clean(raw.decode("utf-8",errors="replace"))
 out=TEXT_ROOT/lang
 out.mkdir(parents=True,exist_ok=True)
 path=out/f"{sid}.txt"
 path.write_text(text+"\\n",encoding="utf-8")
 (out/f"{sid}.manifest.json").write_text(json.dumps({
  "storyId":sid,"sourceUrl":url,"retrievedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
  "sourceSha256":hashlib.sha256(raw).hexdigest(),
  "materializedSha256":hashlib.sha256(text.encode("utf-8")).hexdigest(),
  "method":"Project Gutenberg plain-text source; story-level segmentation remains editorial when the source is a collection",
  "rightsNote":"Project Gutenberg rights status is jurisdiction-specific; verify the target commercial jurisdictions."
 },ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")

def main()->None:
 records={r["id"]:r for r in json.loads(MANIFEST.read_text(encoding="utf-8"))["records"]}
 wanted=sys.argv[1:] or list(records)
 for sid in wanted:
  if sid not in records: raise SystemExit(f"Unknown story id: {sid}")
  rec=records[sid]
  if sid in PG:
   url,_=PG[sid]
   save(sid,rec["language"],url,fetch(url))
   print(f"MATERIALIZED SOURCE {sid}")
  else:
   print(f"CATALOG_ONLY {sid}: source not approved")

if __name__=="__main__": main()
