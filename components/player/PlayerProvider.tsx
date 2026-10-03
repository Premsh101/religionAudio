"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getLocalAudioProgress, getLocalTargetProgress, recordHistory, setLocalAudioProgress, type HistoryKind } from "../../lib/client/history";
import MiniPlayer from "./MiniPlayer";

export type NarrationTarget={kind:HistoryKind;id:string;slug:string;title:string;href:string};
export type PlayerItem={assetId:string;title:string;href:string;coverUrl?:string|null;subtitle?:string;target?:NarrationTarget};
export type Segment={id:string;sequence:number;startMs:number;endMs:number;transcript?:string|null;url?:string|null};

type Progress={currentSequence:number;positionMs:number;progressPercent:number;completedAt:string|null};

export const SPEEDS=[0.8,1,1.25,1.5,2];
export const SLEEPS=[0,15,30,60];

type PlayerState={
  item:PlayerItem|null;segments:Segment[];index:number;playing:boolean;loading:boolean;error:string;
  preparing:{done:number;total:number}|null;resumeWaiting:number|null;
  elapsed:number;duration:number;rate:number;sleep:number;
};
type PlayerApi=PlayerState&{
  load:(item:PlayerItem,opts?:{autoplay?:boolean})=>void;
  /** Call at the start of a tap handler that will await before load(): keeps phone browsers willing to play. */
  prime:()=>void;
  toggle:()=>void;seek:(seconds:number)=>void;skip:(delta:number)=>void;choose:(index:number)=>void;
  cycleRate:()=>void;cycleSleep:()=>void;close:()=>void;
};

const Ctx=createContext<PlayerApi|null>(null);
export function usePlayer(){const v=useContext(Ctx);if(!v)throw new Error("usePlayer outside PlayerProvider");return v}

const SILENT="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
const segSeconds=(s:Segment)=>Math.max(0,(s.endMs-s.startMs)/1000);

/**
 * One audio element for the whole site, so narration keeps playing while the listener browses.
 * Narration comes in parts (segments); progress is saved per part, locally and to the account.
 */
export function PlayerProvider({children}:{children:React.ReactNode}){
  const audioRef=useRef<HTMLAudioElement>(null);
  const [item,setItem]=useState<PlayerItem|null>(null);
  const [segments,setSegments]=useState<Segment[]>([]);
  const [index,setIndex]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [preparing,setPreparing]=useState<{done:number;total:number}|null>(null);
  const [resumeWaiting,setResumeWaiting]=useState<number|null>(null);
  const [time,setTime]=useState(0);
  const [rate,setRate]=useState(1);
  const [sleep,setSleep]=useState(0);

  const assetId=item?.assetId||null;
  const current=segments[index];
  const resumePositionRef=useRef(0);
  const shouldAutoplayRef=useRef(false);
  const waitingRef=useRef(false);
  const segmentCountRef=useRef(0);
  const pendingResumeRef=useRef<{sequence:number;positionMs:number}|null>(null);
  const lastSaveRef=useRef(0);

  const saveProgress=useCallback(async(sequence:number,positionMs:number,completed=false,beacon=false)=>{
    if(!assetId)return;
    lastSaveRef.current=Date.now();
    const seg=segments.find(s=>s.sequence===sequence)||current;
    const durationMs=Math.max(0,seg?seg.endMs-seg.startMs:1);
    const fraction=Math.min(1,Math.max(0,positionMs/Math.max(durationMs,1)));
    const totalParts=Math.max(preparing?.total||0,segments.length,1);
    const percent=completed?100:((Math.max(0,sequence-1)+fraction)/totalParts)*100;
    const position=Math.max(0,Math.round(positionMs));
    // Saved in this browser too, so guests resume where they stopped and see it in history.
    setLocalAudioProgress(assetId,{currentSequence:sequence,positionMs:position,progressPercent:percent});
    if(item?.target)recordHistory({...item.target,progressPercent:percent,completed,assetId,sequence,positionMs:position});
    const payload=JSON.stringify({assetId,currentSequence:sequence,positionMs:position,progressPercent:percent,completed});
    if(beacon&&typeof navigator!=="undefined"&&navigator.sendBeacon){navigator.sendBeacon("/api/user/audio-progress",new Blob([payload],{type:"application/json"}));return}
    try{await fetch("/api/user/audio-progress",{method:"POST",headers:{"Content-Type":"application/json"},body:payload,keepalive:true})}catch{}
  },[assetId,segments,current,preparing,item]);

  // Closing the tab, switching apps or locking the phone keeps the exact position.
  useEffect(()=>{
    const flush=()=>{const a=audioRef.current;if(a&&current&&a.currentTime>0)void saveProgress(current.sequence,a.currentTime*1000,false,true)};
    const onVisibility=()=>{if(document.visibilityState==="hidden")flush()};
    window.addEventListener("pagehide",flush);document.addEventListener("visibilitychange",onVisibility);
    return()=>{window.removeEventListener("pagehide",flush);document.removeEventListener("visibilitychange",onVisibility)};
  },[current,saveProgress]);

  // Load the asset's parts (polling while the narration is still being generated) and the saved position.
  useEffect(()=>{
    if(!assetId)return;
    let cancelled=false,first=true;
    let timer:ReturnType<typeof setTimeout>|null=null;
    segmentCountRef.current=0;waitingRef.current=false;pendingResumeRef.current=null;
    setSegments([]);setIndex(0);setTime(0);setPreparing(null);setResumeWaiting(null);
    async function poll(){
      if(first){setLoading(true);setError("")}
      try{
        const [assetRes,progressRes]=await Promise.all([
          fetch("/api/audio/assets/"+encodeURIComponent(assetId!),{cache:"no-store"}),
          first?fetch("/api/user/audio-progress?assetId="+encodeURIComponent(assetId!)):Promise.resolve(null)
        ]);
        if(!assetRes.ok){const body=await assetRes.json().catch(()=>null);throw new Error(body?.error||"Narration is not ready.")}
        const data=await assetRes.json();
        if(cancelled)return;
        const next:Segment[]=Array.isArray(data.segments)?data.segments.filter((s:Segment)=>s.url):[];
        const ready=data.asset?.status==="READY";
        setPreparing(ready?null:{done:next.length,total:data.asset?.totalSegments||0});
        const prevCount=segmentCountRef.current;
        // Replace only when new parts arrived; swapping in identical data would reset the playing audio.
        if(next.length>prevCount){
          segmentCountRef.current=next.length;
          setSegments(prev=>next.map((s,i)=>prev[i]&&prev[i].id===s.id&&prev[i].url===s.url?prev[i]:s));
          if(waitingRef.current){waitingRef.current=false;shouldAutoplayRef.current=true;setIndex(prevCount)}
        }
        if(first&&next.length){
          const server=progressRes&&progressRes.ok?((await progressRes.json()).progress as Progress|null):null;
          const target=item?.target;
          const p=server||getLocalAudioProgress(assetId!)||(target?getLocalTargetProgress(target.kind,target.id):null);
          if(p&&!(server?.completedAt))pendingResumeRef.current={sequence:Math.max(1,p.currentSequence||1),positionMs:Math.max(0,p.positionMs||0)};
        }
        const pending=pendingResumeRef.current;
        if(pending&&next.length>=pending.sequence){pendingResumeRef.current=null;resumePositionRef.current=pending.positionMs;setIndex(pending.sequence-1)}
        setResumeWaiting(pendingResumeRef.current?pendingResumeRef.current.sequence:null);
        if(!ready)timer=setTimeout(poll,5000);
      }catch(e){if(!cancelled)setError(e instanceof Error?e.message:"Narration unavailable.")}
      finally{if(!cancelled&&first){setLoading(false);first=false}}
    }
    void poll();
    return()=>{cancelled=true;if(timer)clearTimeout(timer)};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[assetId]);

  // Point the audio element at the current part. Keyed on the file URL so new parts arriving don't reload it.
  useEffect(()=>{
    const a=audioRef.current;
    if(!a||!current?.url)return;
    const autoplay=shouldAutoplayRef.current;shouldAutoplayRef.current=false;
    a.pause();a.src=current.url;a.playbackRate=rate;a.load();
    const onLoaded=async()=>{
      if(resumePositionRef.current>0){a.currentTime=Math.min(resumePositionRef.current/1000,Math.max(0,segSeconds(current)-0.2));resumePositionRef.current=0}
      setTime(a.currentTime);
      if(autoplay){try{await a.play()}catch{setPlaying(false)}}
    };
    a.addEventListener("loadedmetadata",onLoaded);
    return()=>a.removeEventListener("loadedmetadata",onLoaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[current?.url,index]);

  useEffect(()=>{if(audioRef.current)audioRef.current.playbackRate=rate},[rate]);

  // Download the next part while this one plays, so the hand-over (inside a paragraph pause) is instant.
  useEffect(()=>{
    const next=segments[index+1];
    if(!next?.url||!playing)return;
    const ctrl=new AbortController();
    fetch(next.url,{signal:ctrl.signal}).then(r=>r.blob()).catch(()=>{});
    return()=>ctrl.abort();
  },[segments,index,playing]);

  useEffect(()=>{
    const a=audioRef.current;
    if(!a)return;
    const onTime=()=>{
      if(a.src===SILENT)return;
      setTime(a.currentTime);
      if(current&&!a.paused&&Date.now()-lastSaveRef.current>=10000)void saveProgress(current.sequence,a.currentTime*1000);
    };
    const onPlay=()=>setPlaying(true);
    const onPause=()=>setPlaying(false);
    const onEnd=async()=>{
      if(!current||a.src===SILENT)return;
      await saveProgress(current.sequence,current.endMs-current.startMs,index===segments.length-1&&!preparing);
      if(index<segments.length-1){shouldAutoplayRef.current=true;setIndex(i=>i+1)}
      else{if(preparing)waitingRef.current=true;setPlaying(false)}
    };
    a.addEventListener("timeupdate",onTime);a.addEventListener("play",onPlay);a.addEventListener("pause",onPause);a.addEventListener("ended",onEnd);
    return()=>{a.removeEventListener("timeupdate",onTime);a.removeEventListener("play",onPlay);a.removeEventListener("pause",onPause);a.removeEventListener("ended",onEnd)};
  },[current,index,segments.length,preparing,saveProgress]);

  // Sleep timer: pause after the chosen number of minutes.
  useEffect(()=>{
    if(!sleep)return;
    const t=setTimeout(()=>{audioRef.current?.pause();setSleep(0)},sleep*60000);
    return()=>clearTimeout(t);
  },[sleep]);

  const choose=useCallback((next:number)=>{
    const target=Math.min(segments.length-1,Math.max(0,next));
    shouldAutoplayRef.current=!audioRef.current?.paused;
    setIndex(target);
  },[segments.length]);

  // Lock-screen, notification-shade and headphone-button controls on phones.
  useEffect(()=>{
    if(typeof navigator==="undefined"||!("mediaSession" in navigator)||!current||!item)return;
    try{
      navigator.mediaSession.metadata=new MediaMetadata({title:item.title,artist:"Sunave",artwork:item.coverUrl?[{src:item.coverUrl,sizes:"512x512"}]:[]});
      navigator.mediaSession.setActionHandler("play",()=>{void audioRef.current?.play()});
      navigator.mediaSession.setActionHandler("pause",()=>{audioRef.current?.pause()});
      navigator.mediaSession.setActionHandler("previoustrack",index>0?()=>choose(index-1):null);
      navigator.mediaSession.setActionHandler("nexttrack",index<segments.length-1?()=>choose(index+1):null);
    }catch{}
  });

  const offsets=useMemo(()=>{let acc=0;return segments.map(s=>{const o=acc;acc+=segSeconds(s);return o})},[segments]);
  const knownDuration=segments.reduce((sum,s)=>sum+segSeconds(s),0);
  // While parts are still being generated, estimate the full length from the average part.
  const duration=preparing&&preparing.total>segments.length&&segments.length?knownDuration/segments.length*preparing.total:knownDuration;
  const elapsed=(offsets[index]||0)+time;

  const toggle=useCallback(async()=>{
    const a=audioRef.current;
    if(!a||!current)return;
    if(a.paused){try{await a.play()}catch{setError("Unable to start this narration in your browser.")}}
    else{a.pause();await saveProgress(current.sequence,a.currentTime*1000)}
  },[current,saveProgress]);

  const seek=useCallback((seconds:number)=>{
    const a=audioRef.current;
    if(!a||!segments.length)return;
    const s=Math.max(0,Math.min(seconds,knownDuration-0.25));
    let i=offsets.findIndex((o,k)=>s>=o&&s<o+segSeconds(segments[k]));
    if(i<0)i=segments.length-1;
    const within=s-offsets[i];
    if(i===index){a.currentTime=within;setTime(within)}
    else{resumePositionRef.current=within*1000;shouldAutoplayRef.current=!a.paused;setIndex(i)}
  },[segments,offsets,index,knownDuration]);

  const value:PlayerApi={
    item,segments,index,playing,loading,error,preparing,resumeWaiting,elapsed,duration,rate,sleep,
    load:(next,opts)=>{
      if(item?.assetId===next.assetId){setItem(next);if(opts?.autoplay&&audioRef.current?.paused&&current)void audioRef.current.play().catch(()=>{});return}
      if(current&&audioRef.current&&audioRef.current.currentTime>0)void saveProgress(current.sequence,audioRef.current.currentTime*1000);
      const a=audioRef.current;
      a?.pause();
      shouldAutoplayRef.current=Boolean(opts?.autoplay);
      // Phones only allow audio started from a tap: play a silent clip now so the real narration may start once loaded.
      if(a&&opts?.autoplay){a.src=SILENT;a.play().catch(()=>{})}
      setItem(next);
    },
    prime:()=>{const a=audioRef.current;if(a&&a.paused&&(!a.src||a.src===SILENT||!item)){a.src=SILENT;a.play().catch(()=>{})}},
    toggle:()=>{void toggle()},
    seek,
    skip:(delta)=>seek(elapsed+delta),
    choose,
    cycleRate:()=>setRate(r=>SPEEDS[(SPEEDS.indexOf(r)+1)%SPEEDS.length]),
    cycleSleep:()=>setSleep(s=>SLEEPS[(SLEEPS.indexOf(s)+1)%SLEEPS.length]),
    close:()=>{
      const a=audioRef.current;
      if(a&&current&&a.currentTime>0)void saveProgress(current.sequence,a.currentTime*1000);
      a?.pause();setItem(null);setSegments([]);setPlaying(false);setSleep(0);
    },
  };

  return <Ctx.Provider value={value}>
    {children}
    {item&&<div aria-hidden className="h-24 bg-bg2"/>}
    <MiniPlayer/>
    <audio ref={audioRef} preload="metadata" className="hidden"/>
  </Ctx.Provider>;
}

export function formatTime(sec:number){
  const s=Math.max(0,Math.round(sec));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;
  return (h?h+":"+String(m).padStart(2,"0"):String(m))+":"+String(x).padStart(2,"0");
}
