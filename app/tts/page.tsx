"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Headphones, Pause, Play, Sparkles } from "lucide-react";
import AppHeader from "../../components/AppHeader";

const profiles=[
  {id:"scripture",name:"Scripture",description:"Calm, deliberate, respectful",engine:"Kokoro"},
  {id:"mythology",name:"Mythology",description:"Warm, cinematic, expressive",engine:"Chatterbox → Kokoro"},
  {id:"folklore",name:"Local folklore",description:"Oral storytelling with suspense",engine:"Chatterbox → Kokoro"},
  {id:"ghost",name:"Ghost story",description:"Slow, tense, atmospheric",engine:"Chatterbox → Kokoro"},
  {id:"kids",name:"Kids",description:"Warm, clear, playful",engine:"Kokoro"},
  {id:"moral-tale",name:"Moral tale",description:"Bright, easy-to-follow",engine:"Kokoro"},
  {id:"mystery",name:"Mystery / crime",description:"Composed, clue-by-clue",engine:"Kokoro"},
  {id:"thriller",name:"Thriller",description:"Taut, urgent, momentum",engine:"Kokoro"},
];

export default function TTSStudio(){
 const [text,setText]=useState("Once upon a time, in a quiet village beneath an old banyan tree, people told a story about a mysterious voice that could be heard after midnight.");
 const [profile,setProfile]=useState("folklore");
 const [busy,setBusy]=useState(false);
 const [playing,setPlaying]=useState(false);
 const audioRef=useRef<HTMLAudioElement|null>(null);

 async function generate(){
   if(!text.trim()||busy)return;
   setBusy(true); setPlaying(false);
   try{
     const response=await fetch("/api/tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,language:"en",profile})});
     if(!response.ok) throw new Error("TTS service is unavailable");
     const blob=await response.blob();
     const url=URL.createObjectURL(blob);
     const audio=new Audio(url);
     audio.onended=()=>{setPlaying(false);URL.revokeObjectURL(url)};
     audioRef.current=audio;
     await audio.play();
     setPlaying(true);
   }catch{
     const voice=new SpeechSynthesisUtterance(text);
     voice.rate=profile==="ghost"?0.82:profile==="scripture"?0.88:profile==="kids"?0.95:profile==="thriller"?1.05:1;
     window.speechSynthesis.cancel();
     window.speechSynthesis.speak(voice);
     voice.onend=()=>setPlaying(false);
     setPlaying(true);
   }finally{setBusy(false)}
 }

 function toggle(){
   if(audioRef.current){
     if(playing){audioRef.current.pause();setPlaying(false)} else {audioRef.current.play();setPlaying(true)}
   }else if(playing){
     window.speechSynthesis.pause();setPlaying(false);
   }
 }

 return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
  <section className="mx-auto max-w-6xl px-5 pb-20 pt-8">
   <div className="max-w-3xl"><p className="text-sm text-amber-300">Free / self-hosted narration</p><h1 className="mt-2 font-display text-5xl">Give every kind of story its own voice.</h1><p className="mt-4 text-zinc-400">Voice identity and narration style are separate. That lets one licensed narrator speak differently for scripture, mythology, folklore, ghost stories and children.</p></div>
   <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_360px]">
    <div className="glass rounded-3xl p-6 md:p-8"><textarea value={text} onChange={e=>setText(e.target.value)} className="min-h-64 w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-zinc-200 outline-none"/><div className="mt-5 flex flex-wrap gap-2">{profiles.map(p=><button key={p.id} onClick={()=>setProfile(p.id)} className={`rounded-2xl border px-4 py-3 text-left ${profile===p.id?"border-amber-300/30 bg-amber-300/[0.06]":"border-white/10 bg-white/[0.02]"}`}><div className="text-sm">{p.name}</div><div className="mt-1 text-xs text-zinc-600">{p.description}</div></button>)}</div><div className="mt-6 flex items-center gap-3"><button onClick={generate} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black disabled:opacity-50"><Sparkles className="h-4 w-4"/>{busy?"Generating…":"Generate + play"}</button><button onClick={toggle} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300">{playing?<Pause className="inline h-4 w-4"/>:<Play className="inline h-4 w-4"/>}</button></div></div>
    <aside className="space-y-4"><div className="glass rounded-3xl p-6"><div className="flex items-center gap-2 text-sm"><Headphones className="h-4 w-4 text-amber-300"/>Selected profile</div><div className="mt-5 font-display text-2xl">{profiles.find(p=>p.id===profile)?.name}</div><div className="mt-2 text-sm text-zinc-500">{profiles.find(p=>p.id===profile)?.description}</div><div className="mt-5 rounded-2xl bg-black/20 p-4 text-xs leading-5 text-zinc-500">Preferred engine: {profiles.find(p=>p.id===profile)?.engine}. The server can fall back to another local engine when the preferred model is unavailable.</div></div><div className="rounded-3xl border border-violet-300/10 bg-violet-300/[0.04] p-6"><div className="text-xs uppercase tracking-[0.16em] text-violet-300">Voice rules</div><p className="mt-3 text-sm leading-6 text-zinc-500">Only use voices and reference recordings with appropriate permission/licensing. Do not clone real people without consent.</p></div></aside>
   </div>
  </section>
 </main>
}