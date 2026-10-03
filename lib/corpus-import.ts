import fs from "node:fs";
import path from "node:path";

/** Shared by the importer script and its tests: turns a stories.json record into Story fields. */
export type CorpusRecord={id:string;title:string;tradition?:string;ageBand?:string;tags?:string[];contentRating?:string;contentWarnings?:string[];en?:string;hi?:string;ar?:string;ur?:string;texts?:Record<string,string>;titles?:Record<string,string>};

const TYPE_BY_COLLECTION:Record<string,string>={
  epics:"MYTHOLOGY",mythology:"MYTHOLOGY",adventure:"STORY",historical:"HISTORICAL_ACCOUNT",biographies:"BIOGRAPHY",
  parables:"MORAL_TALE","moral-tales":"MORAL_TALE",festivals:"FESTIVAL",rituals:"RITUAL","sacred-places":"SACRED_PLACE",
  romance:"STORY","friendship-family":"STORY","war-courage":"HISTORICAL_ACCOUNT",survival:"STORY",inspirational:"BIOGRAPHY",
  adult:"STORY",folklore:"FOLKLORE",ghost:"GHOST_STORY",children:"STORY"
};
const PROFILE_BY_COLLECTION:Record<string,string>={
  epics:"MYTHOLOGY",mythology:"MYTHOLOGY",adventure:"FOLKLORE",parables:"MORAL_TALE","moral-tales":"MORAL_TALE",festivals:"FOLKLORE",
  romance:"FOLKLORE","friendship-family":"MORAL_TALE",folklore:"FOLKLORE",ghost:"GHOST",children:"KIDS",survival:"THRILLER"
};

export function parseAgeBand(band?:string){
  const m=(band||"").match(/(\d+)\s*(?:-\s*(\d+)|\+)?/);
  const min=m?Number(m[1]):null;
  const max=m&&m[2]?Number(m[2]):null;
  return {min,max};
}

export function audienceFor(min:number|null,mature:boolean){
  if(mature)return "ADULTS";
  if(min===null)return "FAMILY";
  if(min<=6)return "KIDS";
  if(min<=10)return "FAMILY";
  if(min<=15)return "TEENS";
  return "ADULTS";
}

export function textsOf(r:CorpusRecord){
  const src=r.texts||r;
  const pick=(l:string)=>typeof (src as Record<string,unknown>)[l]==="string"?((src as Record<string,string>)[l]).trim():"";
  return {en:pick("en"),hi:pick("hi"),ar:pick("ar"),ur:pick("ur")};
}

/** First sentence(s) of the English text, as a placeholder summary until an editor or Gemini writes one. */
export function summaryFrom(text:string){
  const clean=text.replace(/\s+/g," ").trim();
  const first=clean.match(/^.{40,220}?[.!?](\s|$)/)?.[0]||clean.slice(0,200);
  return first.trim();
}

export function toStoryFields(collection:string,r:CorpusRecord){
  const t=textsOf(r);
  const {min,max}=parseAgeBand(r.ageBand);
  const mature=r.contentRating==="ADULT"||collection==="adult"||(min!==null&&min>=18);
  const translations:Record<string,string>=Object.fromEntries((["hi","ar","ur"] as const).filter(l=>t[l]).map(l=>[l,t[l]]));
  const titles=Object.entries(r.titles||{}).filter(([l,v])=>["hi","ar","ur"].includes(l)&&typeof v==="string"&&v.trim());
  if(titles.length){for(const [l,v] of titles)translations["title_"+l]=v.trim();translations.title_src=r.title.trim()}
  return {
    corpusId:r.id,
    collection,
    title:r.title.trim(),
    type:TYPE_BY_COLLECTION[collection]||"STORY",
    audience:audienceFor(min,mature),
    ageMin:min,ageMax:max,
    language:"en",
    body:t.en,
    summary:summaryFrom(t.en),
    narrationProfile:PROFILE_BY_COLLECTION[collection]||"DEFAULT",
    contentWarnings:Array.isArray(r.contentWarnings)?r.contentWarnings.map(String):[],
    matureContent:mature,
    translations:Object.keys(translations).length?translations:null,
  };
}

export function readCorpusCollections(root=path.join(process.cwd(),"data/story-corpus")){
  return fs.readdirSync(root,{withFileTypes:true}).filter(d=>d.isDirectory()).flatMap(d=>{
    const file=path.join(root,d.name,"stories.json");
    if(!fs.existsSync(file))return [];
    const json=JSON.parse(fs.readFileSync(file,"utf8"));
    const records:CorpusRecord[]=Array.isArray(json.records)?json.records:[];
    return records.filter(r=>r&&r.id&&r.title).map(r=>({collection:d.name,record:r}));
  });
}
