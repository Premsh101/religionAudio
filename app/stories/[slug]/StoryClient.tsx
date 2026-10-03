"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bookmark, Headphones, Pause, Play, Sparkles, Volume2 } from "lucide-react";
import Link from "next/link";
import AppHeader from "../../../components/AppHeader";
import NarrationPlayer, { useVoicePreference, type NarrationAssets } from "../../../components/NarrationPlayer";
import { recordHistory } from "../../../lib/client/history";

type Story={title:string;slug:string;content_type:string;audience:string;age_min:number;age_max:number;tag:string;narration_profile:string;style_notes:string;body:string;status:string;storyId?:string;audio?:NarrationAssets;source?:{name:string;url:string;license:string|null;rightsStatus:string}|null};

const labels:Record<string,string>={
  ghost:"After-dark / atmospheric",
  mythology:"Cinematic / warm",
  folklore:"Oral-storytelling / suspense",
  kids:"Warm / playful",
  "moral-tale":"Bright / lesson-focused",
  scripture:"Calm / deliberate",
  mystery:"Composed / clue-by-clue",
  thriller:"Taut / urgent"
};

export default function StoryClient({story}:{story:Story}){
  const [voice,setVoice]=useVoicePreference();
  const [playing,setPlaying]=useState(false);
  const [busy,setBusy]=useState(false);
  const [speed,setSpeed]=useState(1);
  const [progress,setProgress]=useState(0);
  const [bookmarked,setBookmarked]=useState(false);
  const audioRef=useRef<HTMLAudioElement|null>(null);

  const label=labels[story.narration_profile]||"Natural";
  const historyTarget=story.storyId?{kind:"story" as const,id:story.storyId,slug:story.slug,title:story.title,href:"/stories/"+story.slug}:undefined;

  useEffect(()=>{if(historyTarget)recordHistory(historyTarget);},[story.storyId]);

  useEffect(()=>{
    async function load(){
      const [progressRes,bookmarkRes]=await Promise.all([
        fetch("/api/user/progress"),
        fetch("/api/user/bookmarks")
      ]);
      if(progressRes.ok){
        const data=await progressRes.json();
        const item=data.stories?.find((row:any)=>row.story?.slug===story.slug);
        if(item) setProgress(item.progressPercent||0);
      }
      if(bookmarkRes.ok){
        const data=await bookmarkRes.json();
        setBookmarked(Boolean(data.bookmarks?.some((row:any)=>row.story?.slug===story.slug)));
      }
    }
    load().catch(()=>{});
  },[story.slug]);

  async function saveProgress(value:number){
    setProgress(value);
    if(historyTarget)recordHistory({...historyTarget,progressPercent:value,completed:value>=100});
    try{
      await fetch("/api/user/progress",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          kind:"story",
          targetSlug:story.slug,
          sequence:1,
          progressPercent:value,
          completed:value>=100
        })
      });
    }catch{}
  }

  async function toggleBookmark(){
    const res=await fetch("/api/user/bookmarks",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({targetType:"story",targetKey:story.slug})
    });
    if(res.status===401){
      window.location.href="/login?next=/stories/"+encodeURIComponent(story.slug);
      return;
    }
    if(res.ok){
      const data=await res.json();
      setBookmarked(Boolean(data.bookmarked));
    }
  }

  async function play(){
    if(playing){
      audioRef.current?.pause();
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    setBusy(true);
    await saveProgress(Math.max(progress,10));
    const previewText="This is a preview of "+story.title+". "+story.style_notes;
    try{
      const res=await fetch("/api/tts",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({text:previewText,language:"en",profile:story.narration_profile,voice})
      });
      if(!res.ok) throw new Error("TTS unavailable");
      const {url}=await res.json();
      if(!url) throw new Error("TTS unavailable");
      const audio=new Audio(url);
      audio.playbackRate=speed;
      audio.onended=()=>setPlaying(false);
      audioRef.current=audio;
      await audio.play();
      setPlaying(true);
    }catch{
      const utterance=new SpeechSynthesisUtterance(previewText);
      utterance.rate=speed;
      utterance.onend=()=>setPlaying(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setPlaying(true);
    }finally{setBusy(false)}
  }

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <header className="mx-auto max-w-6xl px-5 py-5"><Link href="/stories" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4"/>Story universe</Link></header>
    <section className="mx-auto max-w-5xl px-5 pb-20 pt-6">
      <div className="glass rounded-[32px] p-7 md:p-12">
        <div className="flex items-start justify-between gap-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500"><span className="rounded-full border border-amber-300/15 bg-amber-300/5 px-3 py-1 text-amber-200">{story.tag}</span><span>{story.audience}</span><span>Age {story.age_min}+</span></div>
          <button onClick={toggleBookmark} aria-label={bookmarked?"Remove bookmark":"Save story"} className={bookmarked?"rounded-xl border border-violet-300/20 bg-violet-300/[0.08] p-3 text-violet-200":"rounded-xl border border-white/10 bg-white/[0.02] p-3 text-zinc-500 hover:text-white"}><Bookmark className="h-5 w-5" fill={bookmarked?"currentColor":"none"}/></button>
        </div>
        <h1 className="mt-7 max-w-3xl font-display text-5xl leading-tight">{story.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">{story.style_notes}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button onClick={play} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black disabled:opacity-50">{playing?<Pause className="h-4 w-4"/>:<Play className="h-4 w-4 fill-current"/>}{busy?"Generating…":playing?"Pause":"Play preview"}</button>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-xs text-zinc-500"><Volume2 className="h-4 w-4"/>{label}</div>
          <select value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-zinc-400 outline-none"><option value={0.8}>0.8×</option><option value={1}>1×</option><option value={1.2}>1.2×</option></select>
        </div>
        {story.storyId&&<div className="mt-8"><NarrationPlayer title={story.title+" · full narration"} storyId={story.storyId} target={historyTarget} assets={story.audio||{}} voice={voice} onVoiceChange={setVoice}/></div>}
        <div className="mt-7">
          <div className="flex items-center justify-between text-xs text-zinc-600"><span>Your reading progress</span><span>{Math.round(progress)}%</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-amber-300" style={{width:String(Math.max(2,progress))+"%"}}/></div>
        </div>
      </div>
      {story.body && <article className="mt-5 glass rounded-3xl p-7 md:p-10">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-600">Story</div>
        <div className="mt-5 whitespace-pre-wrap font-display text-lg leading-9 text-zinc-200">{story.body}</div>
      </article>}
      {story.source&&<div className="mt-5 rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.03] p-6"><div className="text-xs uppercase tracking-[0.18em] text-emerald-300">Source & rights</div><div className="mt-3 font-display text-lg">{story.source.name}</div><div className="mt-1 text-xs text-zinc-500">{story.source.license||story.source.rightsStatus}</div><a href={story.source.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs text-zinc-300 hover:text-white">Open source record →</a></div>}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="glass rounded-3xl p-7"><div className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-violet-300"/> Story notes</div><p className="mt-4 text-sm leading-7 text-zinc-400">Published stories will carry their source, tradition, rights status and evidence labels alongside the narrative.</p></div>
        <div className="glass rounded-3xl p-7"><div className="flex items-center gap-2 text-sm"><Headphones className="h-4 w-4 text-amber-300"/> Narration</div><p className="mt-4 text-sm leading-7 text-zinc-400">Narration style follows the story profile: atmospheric for ghost folklore, warm for mythology and clearer, playful pacing for children.</p></div>
      </div>
    </section>
  </main>
}
