"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Headphones, Pause, Play } from "lucide-react";

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
  onBookmark
}:{
  title:string;
  assetId:string;
  onBookmark?:(segment:Segment)=>void;
}){
  const audioRef=useRef<HTMLAudioElement>(null);
  const resumePositionRef=useRef(0);
  const shouldAutoplayRef=useRef(false);
  const saveTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [segments,setSegments]=useState<Segment[]>([]);
  const [index,setIndex]=useState(0);
  const [rate,setRate]=useState(1);
  const [playing,setPlaying]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const current=segments[index];

  const saveProgress=async(sequence:number,positionMs:number,completed=false)=>{
    if(!assetId)return;
    const durationMs=Math.max(0,current ? current.endMs-current.startMs : 1);
    const segmentFraction=Math.min(1,Math.max(0,positionMs/Math.max(durationMs,1)));
    const percent=((Math.max(0,sequence-1)+segmentFraction)/Math.max(segments.length,1))*100;
    try{
      await fetch("/api/user/audio-progress",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          assetId,
          currentSequence:sequence,
          positionMs:Math.max(0,Math.round(positionMs)),
          progressPercent:completed?100:percent,
          completed
        })
      });
    }catch{}
  };

  const queueSave=()=>{
    const a=audioRef.current;
    if(!a||!current)return;
    if(saveTimerRef.current)clearTimeout(saveTimerRef.current);
    saveTimerRef.current=setTimeout(()=>{
      void saveProgress(current.sequence,a.currentTime*1000,false);
    },1200);
  };

  useEffect(()=>{
    return ()=>{
      if(saveTimerRef.current)clearTimeout(saveTimerRef.current);
    };
  },[]);

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      setLoading(true);
      setError("");
      try{
        const [assetRes,progressRes]=await Promise.all([
          fetch("/api/audio/assets/"+encodeURIComponent(assetId)),
          fetch("/api/user/audio-progress?assetId="+encodeURIComponent(assetId))
        ]);
        if(!assetRes.ok){
          const body=await assetRes.json().catch(()=>null);
          throw new Error(body?.error||"Narration is not ready.");
        }
        const data=await assetRes.json();
        if(cancelled)return;
        const nextSegments=Array.isArray(data.segments)?data.segments.filter((s:Segment)=>s.url):[];
        if(!nextSegments.length)throw new Error("Narration has no playable segments.");
        setSegments(nextSegments);
        if(progressRes.ok){
          const p=(await progressRes.json()).progress as Progress|null;
          if(p){
            const nextIndex=Math.min(nextSegments.length-1,Math.max(0,(p.currentSequence||1)-1));
            setIndex(nextIndex);
            resumePositionRef.current=Math.max(0,p.positionMs||0);
          }
        }
      }catch(e){
        if(!cancelled)setError(e instanceof Error?e.message:"Narration unavailable.");
      }finally{
        if(!cancelled)setLoading(false);
      }
    }
    void load();
    return()=>{cancelled=true};
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
  },[current,rate,index]);

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
  },[current,index,segments.length]);

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

    <div className="grid md:grid-cols-[1fr_360px]">
      <article className="min-h-[260px] p-6 md:p-8">
        <div className="text-xs uppercase tracking-[.18em] text-zinc-600">Current narration</div>
        {loading ? <p className="mt-5 text-sm text-zinc-500">Loading narration…</p> :
          <p className="mt-5 font-display text-2xl leading-10 text-white">{current?.transcript||"Narration segment"}</p>}
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
