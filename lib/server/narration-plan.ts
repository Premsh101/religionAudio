import type { PrismaClient } from "../../generated/prisma/client";
import { ensureAudioAsset } from "./audio-assets";
import type { VoiceGender } from "../narration";

/** Languages the voice engine can narrate today. Arabic and Urdu readers hear the English narration. */
export const NARRATION_LANGUAGES=["en","hi"] as const;
export const NARRATION_VOICES:VoiceGender[]=["female","male"];
export type NarrationLanguage=typeof NARRATION_LANGUAGES[number];

/** Listener requests run before narration queued in bulk from the Studio. */
export const PRIORITY_LISTENER=10;
export const PRIORITY_STUDIO=0;

export type AudioCell={language:string;voice:string;status:"READY"|"QUEUED"|"PROCESSING"|"FAILED"|"NONE";done:number;total:number;assetId:string|null};
type Kind="story"|"work";

function languageCode(value?:string|null){return (value||"").toLowerCase().startsWith("hi")?"hi":"en"}

/** Which narration languages a story or book can have: its own language, plus Hindi when a Hindi text exists. */
export function narrationLanguagesFor(item:{language?:string|null;translations?:unknown}):NarrationLanguage[]{
  const base=languageCode(item.language);
  const tr=item.translations&&typeof item.translations==="object"&&!Array.isArray(item.translations)?item.translations as Record<string,unknown>:{};
  const out=new Set<NarrationLanguage>([base]);
  if(typeof tr.hi==="string"&&tr.hi.trim())out.add("hi");
  return NARRATION_LANGUAGES.filter(l=>out.has(l));
}

/** Latest narration per item, language and voice, with how many parts are done. */
export async function audioSummary(prisma:PrismaClient,filter?:{kind:Kind;id:string}){
  const where=filter?(filter.kind==="story"?{storyId:filter.id}:{workId:filter.id}):{OR:[{storyId:{not:null}},{workId:{not:null}}]};
  const assets=await prisma.audioAsset.findMany({where,orderBy:{createdAt:"desc"},
    select:{id:true,storyId:true,workId:true,language:true,voiceId:true,status:true,totalSegments:true,_count:{select:{segments:true}}}});
  const map=new Map<string,AudioCell>();
  for(const a of assets){
    if(a.voiceId!=="female"&&a.voiceId!=="male")continue;
    const key=`${a.storyId?"story:"+a.storyId:"work:"+a.workId}|${a.language}|${a.voiceId}`;
    const existing=map.get(key);
    // Keep the newest, but a usable narration wins over a newer failed attempt.
    if(existing&&!(existing.status==="FAILED"&&a.status!=="FAILED"))continue;
    map.set(key,{language:a.language,voice:a.voiceId,status:a.status,done:a._count.segments,total:a.totalSegments,assetId:a.id});
  }
  return map;
}

export function cellsFor(map:Map<string,AudioCell>,kind:Kind,id:string,languages:readonly string[]):AudioCell[]{
  return languages.flatMap(language=>NARRATION_VOICES.map(voice=>map.get(`${kind}:${id}|${language}|${voice}`)||{language,voice,status:"NONE" as const,done:0,total:0,assetId:null}));
}

/** Queues every missing (or failed) narration for one item. Returns how many new narrations were queued. */
export async function queueNarrations(prisma:PrismaClient,kind:Kind,id:string,languages:readonly NarrationLanguage[],voices:readonly VoiceGender[]=NARRATION_VOICES){
  let queued=0;
  for(const language of languages)for(const voiceGender of voices){
    const r=await ensureAudioAsset(prisma,{...(kind==="story"?{storyId:id}:{workId:id}),language,voiceGender,priority:PRIORITY_STUDIO});
    if(!r.reused)queued++;
  }
  return queued;
}
