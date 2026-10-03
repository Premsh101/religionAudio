"use client";

import { useEffect, useState } from "react";
import { Headphones } from "lucide-react";
import ReadingAudioPanel, { type NarrationTarget } from "./ReadingAudioPanel";

export type VoiceChoice="female"|"male";
export type NarrationAssets={female?:string|null;male?:string|null};

const VOICE_KEY="ra-voice";

/** Listener's preferred narrator voice, remembered in this browser. */
export function useVoicePreference(fallback:VoiceChoice="female"){
  const [voice,setVoice]=useState<VoiceChoice>(fallback);
  useEffect(()=>{
    try{const saved=localStorage.getItem(VOICE_KEY);if(saved==="male"||saved==="female")setVoice(saved);}catch{}
  },[]);
  const choose=(next:VoiceChoice)=>{setVoice(next);try{localStorage.setItem(VOICE_KEY,next)}catch{}};
  return [voice,choose] as const;
}

export function VoiceToggle({voice,onChange}:{voice:VoiceChoice;onChange:(v:VoiceChoice)=>void}){
  return <div role="radiogroup" aria-label="Narrator voice" className="inline-flex rounded-2xl border border-white/10 p-1 text-xs">
    {(["female","male"] as const).map(v=><button key={v} role="radio" aria-checked={voice===v} onClick={()=>onChange(v)} className={"rounded-xl px-3 py-2 "+(voice===v?"bg-white text-black":"text-zinc-400 hover:text-white")}>{v==="female"?"Female voice":"Male voice"}</button>)}
  </div>;
}

export default function NarrationPlayer({title,storyId,workId,assets,target,voice:controlledVoice,onVoiceChange}:{title:string;storyId?:string;workId?:string;assets:NarrationAssets;target?:NarrationTarget;voice?:VoiceChoice;onVoiceChange?:(v:VoiceChoice)=>void}){
  const [ownVoice,setOwnVoice]=useVoicePreference();
  const voice=controlledVoice||ownVoice;
  const setVoice=onVoiceChange||setOwnVoice;
  const [known,setKnown]=useState<NarrationAssets>(assets);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const assetId=known[voice]||null;

  async function prepare(){
    setBusy(true);setError("");
    try{
      const res=await fetch("/api/audio/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({storyId,workId,voice})});
      const data=await res.json().catch(()=>null);
      if(!res.ok||!data?.assetId)throw new Error(data?.error||"Narration is not available right now.");
      setKnown(k=>({...k,[voice]:data.assetId}));
    }catch(e){setError(e instanceof Error?e.message:"Narration is not available right now.")}
    finally{setBusy(false)}
  }

  if(!storyId&&!workId)return null;
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <VoiceToggle voice={voice} onChange={setVoice}/>
      {!assetId&&<button onClick={prepare} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white disabled:opacity-50"><Headphones className="h-4 w-4"/>{busy?"Starting…":"Listen to full narration"}</button>}
    </div>
    {error&&<p className="text-sm text-amber-200">{error}</p>}
    {assetId&&<ReadingAudioPanel key={assetId} title={title} assetId={assetId} target={target}/>}
  </div>;
}
