"use client";

import { useState } from "react";
import { useVoicePreference, type NarrationAssets } from "../NarrationPlayer";
import { usePlayer, type PlayerItem } from "./PlayerProvider";

/**
 * Connects a story or book page to the site-wide player: picks the voice, asks the server to prepare
 * narration the first time, and plays or pauses it.
 */
export function useNarration({storyId,workId,language,assets,item}:{storyId?:string;workId?:string;language?:string;assets:NarrationAssets;item:Omit<PlayerItem,"assetId">}){
  const player=usePlayer();
  const [voice,setVoice]=useVoicePreference();
  const [known,setKnown]=useState<NarrationAssets>(assets);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const assetId=known[voice]||null;
  const isCurrent=Boolean(assetId)&&player.item?.assetId===assetId;

  async function play(){
    if(isCurrent){player.toggle();return}
    player.prime();
    setError("");
    let id=assetId;
    if(!id){
      setBusy(true);
      try{
        const res=await fetch("/api/audio/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({storyId,workId,voice,language})});
        const data=await res.json().catch(()=>null);
        if(!res.ok||!data?.assetId)throw new Error(data?.error||"");
        id=data.assetId as string;
        setKnown(k=>({...k,[voice]:id}));
      }catch(e){setError(e instanceof Error&&e.message?e.message:"unavailable");return}
      finally{setBusy(false)}
    }
    player.load({...item,assetId:id!},{autoplay:true});
  }

  return {voice,setVoice,assetId,isCurrent,busy,error,play,playing:isCurrent&&player.playing,player};
}
