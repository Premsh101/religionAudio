"use client";

/** Listening/reading history kept in this browser, so guests also get "Continue listening" and recommendations. */
export type HistoryKind="story"|"work";
export type LocalHistoryEntry={
  kind:HistoryKind;id:string;slug:string;title:string;href:string;
  progressPercent:number;completed?:boolean;updatedAt:string;
  assetId?:string;sequence?:number;positionMs?:number;
  /** Books: last passage read (audio uses sequence/positionMs). */
  passageSequence?:number;
};

const HISTORY_KEY="ra-history";
const AUDIO_KEY="ra-audio-progress";
const MAX_ENTRIES=60;

function read<T>(key:string,fallback:T):T{
  try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}
}
function write(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}

export function getHistory():LocalHistoryEntry[]{
  const list=read<LocalHistoryEntry[]>(HISTORY_KEY,[]);
  return Array.isArray(list)?list.filter(e=>e&&e.id&&e.kind):[];
}

/** Omit progressPercent to just mark the item as opened, keeping its saved progress. */
export function recordHistory(entry:Omit<LocalHistoryEntry,"updatedAt"|"progressPercent">&{progressPercent?:number;updatedAt?:string}){
  const list=getHistory();
  const existing=list.find(e=>e.kind===entry.kind&&e.id===entry.id);
  const progress=entry.progressPercent??existing?.progressPercent??0;
  const merged:LocalHistoryEntry={
    ...existing,...entry,
    progressPercent:Math.max(0,Math.min(100,Math.round(progress))),
    completed:entry.completed??existing?.completed??false,
    updatedAt:entry.updatedAt||new Date().toISOString()
  };
  write(HISTORY_KEY,[merged,...list.filter(e=>!(e.kind===entry.kind&&e.id===entry.id))].slice(0,MAX_ENTRIES));
}

export function clearHistory(){write(HISTORY_KEY,[]);write(AUDIO_KEY,{})}

export type LocalAudioProgress={currentSequence:number;positionMs:number;progressPercent:number;updatedAt:string};

export function getLocalAudioProgress(assetId:string):LocalAudioProgress|null{
  const map=read<Record<string,LocalAudioProgress>>(AUDIO_KEY,{});
  return map[assetId]||null;
}

export function setLocalAudioProgress(assetId:string,progress:Omit<LocalAudioProgress,"updatedAt">){
  const map=read<Record<string,LocalAudioProgress>>(AUDIO_KEY,{});
  map[assetId]={...progress,updatedAt:new Date().toISOString()};
  const keys=Object.keys(map).sort((a,b)=>map[b].updatedAt.localeCompare(map[a].updatedAt));
  write(AUDIO_KEY,Object.fromEntries(keys.slice(0,MAX_ENTRIES).map(k=>[k,map[k]])));
}

/** Latest saved position for any narration of this story/book (e.g. after switching voice). */
export function getLocalTargetProgress(kind:HistoryKind,id:string){
  const entry=getHistory().find(e=>e.kind===kind&&e.id===id);
  return entry&&entry.sequence?{currentSequence:entry.sequence,positionMs:entry.positionMs||0,progressPercent:entry.progressPercent}:null;
}
