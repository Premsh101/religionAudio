"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Headphones, Pause, Play, Sparkles, Volume2 } from "lucide-react";
import stories from "../../../data/stories.seed.json";

type Story={title:string;slug:string;content_type:string;audience:string;age_min:number;age_max:number;tag:string;narration_profile:string;style_notes:string;status:string};

export default function StoryPage({params}:{params:{slug:string}}){
  const story=(stories as Story[]).find(item=>item.slug===params.slug) || (stories as Story[])[0];
  const [playing,setPlaying]=useState(false);
  const [busy,setBusy]=useState(false);
  const [speed,setSpeed]=useState(1);
  const audioRef=useRef<HTMLAudioElement|null>(null);

  const label=useMemo(()=>({
    ghost:"After-dark / atmospheric",
    mythology:"Cinematic / warm",
    folklore:"Oral-storytelling / suspense",
    kids:"Warm / playful",
    "moral-tale":"Bright / lesson-focused",
    scripture:"Calm / deliberate"
  } as Record<string,string>)[story.narration_profile] || "Natural", [story.narration_profile]);

  async function play(){
    if(playing){audioRef.current?.pause();setPlaying(false);return;}
    setBusy(true);
    try{
      const res=await fetch("/api/tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        text:`This is a preview of ${story.title}. ${story.style_notes}`,
        language:"en",
        profile:story.narration_profile
      })});
      if(!res.ok) throw new Error("TTS unavailable");
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const audio=new Audio(url);
      audio.playbackRate=speed;
      audio.onended=()=>{setPlaying(false);URL.revokeObjectURL(url)};
      audioRef.current=audio;
      await audio.play();
      setPlaying(true);
    }catch{
      const utterance=new SpeechSynthesisUtterance(`This is a preview of ${story.title}. ${story.style_notes}`);
      utterance.rate=speed;
      utterance.onend=()=>setPlaying(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setPlaying(true);
    }finally{setBusy(false)}
  }

  return <main className="min-h-screen bg-zinc-950">
    <header className="mx-auto max-w-6xl px-5 py-5"><Link href="/stories" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4"/>Story universe</Link></header>
    <section className="mx-auto max-w-5xl px-5 pb-20 pt-8">
      <div className="glass rounded-[32px] p-7 md:p-12">
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500"><span className="rounded-full border border-amber-300/15 bg-amber-300/5 px-3 py-1 text-amber-200">{story.tag}</span><span>{story.audience}</span><span>Age {story.age_min}+</span></div>
        <h1 className="mt-7 max-w-3xl font-display text-5xl leading-tight">{story.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">{story.style_notes}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button onClick={play} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black disabled:opacity-50">{playing?<Pause className="h-4 w-4"/>:<Play className="h-4 w-4 fill-current" />}{busy?"Generating…":playing?"Pause":"Play preview"}</button>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-xs text-zinc-500"><Volume2 className="h-4 w-4"/>{label}</div>
          <select value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-zinc-400 outline-none"><option value={0.8}>0.8×</option><option value={1}>1×</option><option value={1.2}>1.2×</option></select>
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="glass rounded-3xl p-7"><div className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-violet-300"/> Story notes</div><p className="mt-4 text-sm leading-7 text-zinc-400">This is a content placeholder until the editorial corpus is populated. The finished story will carry its source, tradition, rights status and evidence labels.</p></div>
        <div className="glass rounded-3xl p-7"><div className="flex items-center gap-2 text-sm"><Headphones className="h-4 w-4 text-amber-300"/> Narration</div><p className="mt-4 text-sm leading-7 text-zinc-400">The same speaker identity can be paired with a different narration profile. Ghost stories can be slower and quieter; kids stories can be warmer and clearer.</p></div>
      </div>
    </section>
  </main>
}
