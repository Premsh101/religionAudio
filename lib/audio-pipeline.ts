import { getNarrationPlan, type VoiceGender } from "./narration";

export type NarrationChunk={sequence:number;text:string;startMs:number;endMs:number;profile:string;trail:"paragraph"|"sentence"|"none"};

/** The first part is short so playback starts within seconds; later parts are long so joins are rare. */
const FIRST_CHARS=700;
const MAX_CHARS=2400;

/** Sentence ends are punctuation followed by a space, so "3.5" or "4.0" never split. */
function sentencesOf(paragraph:string){
  return paragraph.split(/(?<=[.!?।؟…]["'”’)\]]*)\s+/).map(s=>s.trim()).filter(Boolean);
}

/**
 * Splits text into narration parts. Parts end at a paragraph break whenever possible (never mid-sentence),
 * so the switch from one audio file to the next lands inside a natural pause. Each part carries the pause
 * that should follow it ("trail"), which the TTS service bakes into the end of the file.
 */
export function splitForNarration(text:string,profile="default"):NarrationChunk[]{
  const plan=getNarrationPlan(profile);
  const paragraphs=text.split(/\n\s*\n/).map(p=>p.replace(/\s+/g," ").trim()).filter(Boolean);
  const parts:{text:string;endsParagraph:boolean}[]=[];
  let current:string[]=[];// paragraphs (or pieces of one) in the part being built
  let size=0;
  const limit=()=>parts.length===0?FIRST_CHARS:MAX_CHARS;
  const flush=(endsParagraph:boolean)=>{if(current.length){parts.push({text:current.join("\n\n"),endsParagraph});current=[];size=0}};

  for(const paragraph of paragraphs){
    if(size&&size+paragraph.length+2>limit())flush(true);
    if(paragraph.length<=limit()){current.push(paragraph);size+=paragraph.length+2;continue}
    // A paragraph longer than a part: split it between sentences.
    let piece="";
    for(const sentence of sentencesOf(paragraph)){
      if(piece&&size+piece.length+sentence.length+1>limit()){
        current.push(piece);flush(false);piece="";
      }
      piece=piece?piece+" "+sentence:sentence;
    }
    if(piece){current.push(piece);size+=piece.length+2}
  }
  flush(true);

  let cursor=0;
  return parts.map((part,i)=>{
    const estimated=Math.max(1200,Math.round(part.text.length/(14*plan.rate)*1000));
    const start=cursor;cursor=start+estimated;
    const trail=i===parts.length-1?"none":part.endsParagraph?"paragraph":"sentence";
    return {sequence:i+1,text:part.text,startMs:start,endMs:cursor,profile:plan.profile,trail};
  });
}

export function buildSegmentRequests(text:string,profile:string,language="en",voiceGender?:VoiceGender){
  const plan=getNarrationPlan(profile);
  const chunks=splitForNarration(text,plan.profile);
  return chunks.map(chunk=>({...chunk,profile:plan.profile,language,request:{text:chunk.text,language,profile:plan.profile,voice_gender:voiceGender,format:"mp3" as const,trail:chunk.trail}}));
}
