"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Headphones, Pause, Play } from "lucide-react";
import { getLocalAudioProgress, getLocalTargetProgress, recordHistory, setLocalAudioProgress, type HistoryKind } from "../lib/client/history";

export type NarrationTarget={kind:HistoryKind;id:string;slug:string;title:string;href:string};

type Segment={
  id:string;
  sequence:number;
  startMs:number;
  endMs:number;
  storageKey?:string|null;
  transcript?:string|null;
  url?:string|null;
};

type Progress={
  currentSequence:number;
  positionMs:number;
  progressPercent:number;
  completedAt:string|null;
};

export default function ReadingAudioPanel({
  title,
  assetId,
  target,
  onBookmark
}:{
  title:string;
  assetId:string;
  target?:NarrationTarget;
  onBookmark?:(segment:Segment)=>void;
}){
  const audioRef=useRef<HTMLAudioElement>(null);
  const resumePositionRef=useRef(0);
  const shouldAutoplayRef=useRef(false);
  const [segments,setSegments]=useState<Segment[]>([]);
  const [index,setIndex]=useState(0);
  const [rate,setRate]=useState(1);
  const [playing,setPlaying]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [preparing,setPreparing]=useState<{done:number;total:number}|null>(null);
  const waitingRef=useRef(false);
  const segmentCountRef=useRef(0);
  const pendingResumeRef=useRef<{sequence:number;positionMs:number}|null>(null);
  const [resumeWaiting,setResumeWaiting]=useState<number|null>(null);
  const current=segments[index];

  const lastSaveRef=useRef(0);

  const saveProgress=async(sequence:number,positionMs:number,completed=false,beacon=false)=>{
    if(!assetId)return;
    lastSaveRef.current=Date.now();
    const seg=segments.find(s=>s.sequence===sequence)||current;
    const durationMs=Math.max(0,seg ? seg.endMs-seg.startMs : 1);
    const segmentFraction=Math.min(1,Math.max(0,positionMs/Math.max(durationMs,1)));
    const totalParts=Math.max(preparing?.total||0,segments.length,1);
    const percent=completed?100:((Math.max(0,sequence-1)+segmentFraction)/totalParts)*100;
    const position=Math.max(0,Math.round(positionMs));
    // Saved in this browser too, so guests resume where they stopped and see it in history.
    setLocalAudioProgress(assetId,{currentSequence:sequence,positionMs:position,progressPercent:percent});
    if(target)recordHistory({...target,progressPercent:percent,completed,assetId,sequence,positionMs:position});
    const payload=JSON.stringify({assetId,currentSequence:sequence,positionMs:position,progressPercent:percent,completed});
    if(beacon&&typeof navigator!=="undefined"&&navigator.sendBeacon){
      navigator.sendBeacon("/api/user/audio-progress",new Blob([payload],{type:"application/json"}));
      return;
    }
    try{
      await fetch("/api/user/audio-progress",{method:"POST",headers:{"Content-Type":"application/json"},body:payload,keepalive:true});
    }catch{}
  };

  // Save at most every 10 s while playing (timeupdate fires several times a second).
  const queueSave=()=>{
    const a=audioRef.current;
    if(!a||!current||a.paused)return;
    if(Date.now()-lastSaveRef.current<10000)return;
    void saveProgress(current.sequence,a.currentTime*1000,false);
  };

  // Closing the tab, switching apps or locking the phone keeps the exact position.
  useEffect(()=>{
    const flush=()=>{
      const a=audioRef.current;
      if(a&&current&&a.currentTime>0)void saveProgress(current.sequence,a.currentTime*1000,false,true);
    };
    const onVisibility=()=>{if(document.visibilityState==="hidden")flush()};
    window.addEventListener("pagehide",flush);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{window.removeEventListener("pagehide",flush);document.removeEventListener("visibilitychange",onVisibility)};
  });

  useEffect(()=>{
    let cancelled=false;
    let timer:ReturnType<typeof setTimeout>|null=null;
    let first=true;
    segmentCountRef.current=0;
    waitingRef.current=false;
    pendingResumeRef.current=null;
    async function load(){
      if(first){setLoading(true);setError("");}
      try{
        const [assetRes,progressRes]=await Promise.all([
          fetch("/api/audio/assets/"+encodeURIComponent(assetId),{cache:"no-store"}),
          first?fetch("/api/user/audio-progress?assetId="+encodeURIComponent(assetId)):Promise.resolve(null)
        ]);
        if(!assetRes.ok){
          const body=await assetRes.json().catch(()=>null);
          throw new Error(body?.error||"Narration is not ready.");
        }
        const data=await assetRes.json();
        if(cancelled)return;
        const nextSegments:Segment[]=Array.isArray(data.segments)?data.segments.filter((s:Segment)=>s.url):[];
        const ready=data.asset?.status==="READY";
        setPreparing(ready?null:{done:nextSegments.length,total:data.asset?.totalSegments||0});
        const prevCount=segmentCountRef.current;
        // Replace only when new parts arrived (or on first load); swapping in identical data would reset the playing <audio>.
        if(nextSegments.length>prevCount){
          segmentCountRef.current=nextSegments.length;
          // Keep existing segment objects so the part that is playing is not reloaded.
          setSegments(prev=>nextSegments.map((s,i)=>prev[i]&&prev[i].id===s.id&&prev[i].url===s.url?prev[i]:s));
          if(waitingRef.current&&nextSegments.length>prevCount){
            // The listener reached the end of what was ready; continue as soon as the next part lands.
            waitingRef.current=false;
            shouldAutoplayRef.current=true;
            setIndex(prevCount);
          }
        }
        if(first&&nextSegments.length){
          const server=progressRes&&progressRes.ok?((await progressRes.json()).progress as Progress|null):null;
          const p=server||getLocalAudioProgress(assetId)||(target?getLocalTargetProgress(target.kind,target.id):null);
          if(p&&!(server?.completedAt))pendingResumeRef.current={sequence:Math.max(1,p.currentSequence||1),positionMs:Math.max(0,p.positionMs||0)};
        }
        const pending=pendingResumeRef.current;
        if(pending&&nextSegments.length>=pending.sequence){
          // The saved part exists (possibly only now, after switching to a voice still being generated).
          pendingResumeRef.current=null;
          resumePositionRef.current=pending.positionMs;
          setIndex(pending.sequence-1);
        }
        setResumeWaiting(pendingResumeRef.current?pendingResumeRef.current.sequence:null);
        if(!ready)timer=setTimeout(load,5000);
      }catch(e){
        if(!cancelled)setError(e instanceof Error?e.message:"Narration unavailable.");
      }finally{
        if(!cancelled&&first){setLoading(false);first=false;}
      }
    }
    void load();
    return()=>{cancelled=true;if(timer)clearTimeout(timer)};
  },[assetId]);

  useEffect(()=>{
    const a=audioRef.current;
    if(!a||!current?.url)return;
    const shouldAutoplay=shouldAutoplayRef.current;
    shouldAutoplayRef.current=false;
    a.pause();
    a.src=current.url;
    a.playbackRate=rate;
    a.load();

    const onLoaded=async()=>{
      if(resumePositionRef.current>0 && index===0 || resumePositionRef.current>0){
        const segmentDuration=Math.max(0,(current.endMs-current.startMs)/1000);
        a.currentTime=Math.min(resumePositionRef.current/1000,Math.max(0,segmentDuration-0.2));
        resumePositionRef.current=0;
      }
      if(shouldAutoplay){
        try{await a.play();setPlaying(true)}catch{setPlaying(false)}
      }
    };
    a.addEventListener("loadedmetadata",onLoaded);
    return()=>a.removeEventListener("loadedmetadata",onLoaded);
    // Keyed on the file URL: new parts arriving or a speed change must not reload the part that is playing.
  },[current?.url,index]);

  useEffect(()=>{
    const a=audioRef.current;
    if(a)a.playbackRate=rate;
  },[rate]);

  useEffect(()=>{
    const a=audioRef.current;
    if(!a)return;
    const onTime=()=>queueSave();
    const onPlay=()=>setPlaying(true);
    const onPause=()=>setPlaying(false);
    const onEnd=async()=>{
      if(!current)return;
      await saveProgress(current.sequence,(current.endMs-current.startMs),index===segments.length-1);
      if(index<segments.length-1){
        shouldAutoplayRef.current=true;
        setIndex(i=>i+1);
      }else{
        if(preparing)waitingRef.current=true;
        setPlaying(false);
      }
    };
    a.addEventListener("timeupdate",onTime);
    a.addEventListener("play",onPlay);
    a.addEventListener("pause",onPause);
    a.addEventListener("ended",onEnd);
    return()=>{
      a.removeEventListener("timeupdate",onTime);
      a.removeEventListener("play",onPlay);
      a.removeEventListener("pause",onPause);
      a.removeEventListener("ended",onEnd);
    };
  },[current,index,segments.length,preparing]);

  const toggle=async()=>{
    const a=audioRef.current;
    if(!a||!current)return;
    if(a.paused){
      try{await a.play();setPlaying(true)}catch{setError("Unable to start this narration in your browser.")};
    }else{
      a.pause();
      await saveProgress(current.sequence,a.currentTime*1000,false);
    }
  };

  // Lock-screen, notification-shade and headphone-button controls on phones.
  useEffect(()=>{
    if(typeof navigator==="undefined"||!("mediaSession" in navigator)||!current)return;
    try{
      navigator.mediaSession.metadata=new MediaMetadata({title,artist:"Sacred Stories",album:"Part "+current.sequence+" of "+Math.max(preparing?.total||0,segments.length)});
      navigator.mediaSession.setActionHandler("play",()=>{void audioRef.current?.play()});
      navigator.mediaSession.setActionHandler("pause",()=>{audioRef.current?.pause()});
      navigator.mediaSession.setActionHandler("previoustrack",index>0?()=>choose(index-1):null);
      navigator.mediaSession.setActionHandler("nexttrack",index<segments.length-1?()=>choose(index+1):null);
    }catch{}
  });

  const choose=(next:number)=>{
    const target=Math.min(segments.length-1,Math.max(0,next));
    shouldAutoplayRef.current=!audioRef.current?.paused;
    setIndex(target);
  };

  const progress=((index+1)/Math.max(segments.length,1))*100;
  const duration=Math.max(1,Math.round(((current?.endMs||0)-(current?.startMs||0))/1000));

  return <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
    <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[.18em] text-zinc-500"><Headphones className="h-4 w-4"/>Read & listen</div>
          <h2 className="mt-1 font-display text-xl font-semibold text-white">{title}</h2>
        </div>
        <button onClick={()=>setRate(r=>r===1?1.25:r===1.25?1.5:1)} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300">{rate}×</button>
      </div>
    </div>

    {error ? <div className="border-b border-amber-300/10 bg-amber-300/[0.03] px-5 py-4 text-sm text-amber-100">{error}</div> : null}
    {!error&&resumeWaiting ? <div className="border-b border-white/10 bg-amber-300/[0.04] px-5 py-3 text-xs text-amber-100">Your place is part {resumeWaiting}. It will jump there as soon as that part is ready in this voice.</div> : null}
    {!error&&preparing ? <div className="border-b border-white/10 bg-white/[0.02] px-5 py-3 text-xs text-zinc-400">
      Preparing narration for the first time: {preparing.done} of {preparing.total||"…"} parts ready. {preparing.done?"You can start listening now.":"The first part is usually ready within a minute or two."} After this it is saved and plays instantly for everyone.
    </div> : null}

    <div className="grid md:grid-cols-[1fr_360px]">
      <article className="min-h-[260px] p-6 md:p-8">
        <div className="text-xs uppercase tracking-[.18em] text-zinc-600">Current narration</div>
        {loading ? <p className="mt-5 text-sm text-zinc-500">Loading narration…</p> :
          <p className="mt-5 font-display text-2xl leading-10 text-white">{current?.transcript||(preparing?"Generating the first part…":"Narration segment")}</p>}
        <p className="mt-5 text-xs text-zinc-600">Part {current?.sequence||1} · about {duration}s</p>
      </article>

      <aside className="border-t border-white/10 bg-black/20 p-5 md:border-l md:border-t-0">
        <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[.18em] text-zinc-600"><span>Segments</span><span>{index+1}/{segments.length||1}</span></div>
        <div className="space-y-2">
          {segments.map((s,i)=><button key={s.id} onClick={()=>choose(i)} className={"w-full rounded-2xl border p-3 text-left "+(i===index?"border-white/20 bg-white/10":"border-white/5 bg-white/[.02] hover:border-white/10")}><div className="flex items-center justify-between text-xs text-zinc-500"><span>Part {s.sequence}</span><span>{Math.max(1,Math.round((s.endMs-s.startMs)/1000))}s</span></div><p className="mt-1 line-clamp-2 text-sm text-zinc-300">{s.transcript}</p></button>)}
        </div>
      </aside>
    </div>

    <div className="flex items-center gap-3 border-t border-white/10 p-4">
      <button disabled={loading||index===0} onClick={()=>choose(index-1)} className="rounded-xl border border-white/10 p-3 disabled:opacity-30"><ChevronLeft className="h-5 w-5"/></button>
      <button disabled={loading||!current?.url} onClick={toggle} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black disabled:opacity-40">{playing?<Pause className="h-5 w-5"/>:<Play className="ml-0.5 h-5 w-5"/>}</button>
      <button disabled={loading||index===segments.length-1} onClick={()=>choose(index+1)} className="rounded-xl border border-white/10 p-3 disabled:opacity-30"><ChevronRight className="h-5 w-5"/></button>
      <div className="min-w-0 flex-1"><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white transition-all" style={{width:String(Math.max(3,progress))+"%"}}/></div><div className="mt-2 text-xs text-zinc-600">Audiobook progress · {Math.round(progress)}%</div></div>
      {onBookmark&&current&&<button onClick={()=>onBookmark(current)} className="rounded-xl border border-white/10 p-3 text-zinc-300" aria-label="Bookmark narration segment"><Bookmark className="h-5 w-5"/></button>}
      <audio ref={audioRef} preload="metadata"/>
    </div>
  </section>;
}
