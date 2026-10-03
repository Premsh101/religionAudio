import { getNarrationPlan, type VoiceGender } from "./narration";

export type NarrationChunk={sequence:number;text:string;startMs:number;endMs:number;profile:string};

const MAX_CHARS=1200;

export function splitForNarration(text:string,profile="default",maxChars=MAX_CHARS):NarrationChunk[]{
 const plan=getNarrationPlan(profile);
 // Keep paragraph breaks: the TTS service uses them for longer, scene-level pauses.
 const paragraphs=text.split(/\n\s*\n/).map(p=>p.replace(/\s+/g," ").trim()).filter(Boolean);
 if(!paragraphs.length)return [];
 const chunks:string[]=[];let current="";
 for(const paragraph of paragraphs){
  const sentences=paragraph.match(/[^.!?।]+[.!?।]+["'”’)]*|[^.!?।]+$/g)||[paragraph];
  let first=true;
  for(const sentence of sentences){
   const s=sentence.trim();if(!s)continue;
   const sep=first?"\n\n":" ";first=false;
   if(current&&current.length+s.length+sep.length>maxChars){chunks.push(current);current="";}
   current=current?`${current}${sep}${s}`:s;
  }
 }
 if(current)chunks.push(current);
 let cursor=0;
 return chunks.map((chunk,i)=>{const estimated=Math.max(1200,Math.round(chunk.length/(14*plan.rate)*1000));const start=cursor;const end=start+estimated+plan.pauseMs;cursor=end;return {sequence:i+1,text:chunk,startMs:start,endMs:end,profile:plan.profile}});
}

export function buildSegmentRequests(text:string,profile:string,language="en",voiceGender?:VoiceGender){
 const plan=getNarrationPlan(profile);
 const chunks=splitForNarration(text,plan.profile);
 return chunks.map(chunk=>({...chunk,profile:plan.profile,language,request:{text:chunk.text,language,profile:plan.profile,voice_gender:voiceGender,format:"mp3" as const}}));
}
