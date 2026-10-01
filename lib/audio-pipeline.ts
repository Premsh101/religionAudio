import { getNarrationPlan } from "./narration";

export type NarrationChunk={sequence:number;text:string;startMs:number;endMs:number;profile:string};

const MAX_CHARS=1200;

export function splitForNarration(text:string,maxChars=MAX_CHARS):NarrationChunk[]{
 const clean=text.replace(/\s+/g," ").trim();
 if(!clean)return [];
 const sentences=clean.match(/[^.!?।]+[.!?।]+|[^.!?।]+$/g)||[clean];
 const chunks:string[]=[];let current="";
 for(const sentence of sentences){const s=sentence.trim();if(!s)continue;if(current&&current.length+s.length+1>maxChars){chunks.push(current);current="";}current=current?`${current} ${s}`:s;}
 if(current)chunks.push(current);
 let cursor=0;
 return chunks.map((chunk,i)=>{const plan=getNarrationPlan("folklore");const estimated=Math.max(1200,Math.round(chunk.length/(2.2*plan.rate)*1000));const start=cursor;const end=start+estimated+plan.pauseMs;cursor=end;return {sequence:i+1,text:chunk,startMs:start,endMs:end,profile:plan.profile}});
}

export function buildSegmentRequests(text:string,profile:string,language="en"){
 const chunks=splitForNarration(text);
 return chunks.map(chunk=>({...chunk,profile,language,request:{text:chunk.text,language,profile,engine:getNarrationPlan(profile).engine}}));
}
