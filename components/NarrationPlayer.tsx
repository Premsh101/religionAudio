"use client";

import { useEffect, useState } from "react";
import { useT } from "./AppProvider";

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
  const t=useT();
  return <div role="radiogroup" aria-label="Narrator voice" className="inline-flex rounded-full border border-line bg-chip p-1 text-xs font-bold">
    {(["female","male"] as const).map(v=><button key={v} role="radio" aria-checked={voice===v} onClick={()=>onChange(v)} className={"rounded-full px-3.5 py-2 transition "+(voice===v?"bg-ink text-bg":"text-mut hover:text-ink")}>{v==="female"?t("story.female"):t("story.male")}</button>)}
  </div>;
}
