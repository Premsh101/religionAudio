"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Pause, Play, Sparkles, Volume2 } from "lucide-react";
import AppHeader from "../../../components/AppHeader";

type Passage={id:string;reference:string;sequence:number;text:string};
type Work={id:string;title:string;slug:string;language:string;translator:string|null;edition:string|null;rightsStatus:string;source:{name:string;url:string;license:string|null}|null;passages:Passage[]};

export default function WorkReader({work}:{work:Work}){
  const [active,setActive]=useState(work.passages[0]?.sequence||1);
  const [playing,setPlaying]=useState(false);
  const [busy,setBusy]=useState(false);
  const [bookmarked,setBookmarked]=useState(false);
  const current=work.passages.find(p=>p.sequence===active)||work.passages[0];
  const total=work.passages.length;

  useEffect(()=>{
    async function load(){
      const [progressRes,bookmarkRes]=await Promise.all([
        fetch("/api/user/progress"),
        fetch("/api/user/bookmarks")
      ]);
      if(progressRes.ok){
        const data=await progressRes.json();
        const item=data.works?.find((row:any)=>row.work?.slug===work.slug);
        if(item?.currentSequence) setActive(Math.min(total,Math.max(1,item.currentSequence)));
      }
      if(bookmarkRes.ok){
        const data=await bookmarkRes.json();
        setBookmarked(Boolean(data.bookmarks?.some((row:any)=>row.work?.slug===work.slug)));
      }
    }
    load().catch(()=>{});
  },[work.slug,total]);

  async function saveProgress(sequence:number){
    try{
      await fetch("/api/user/progress",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({kind:"work",targetSlug:work.slug,sequence,progressPercent:total?(sequence/total)*100:0,completed:sequence>=total})
      });
    }catch{}
  }

  async function toggleBookmark(){
    const res=await fetch("/api/user/bookmarks",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({targetType:"work",targetKey:work.slug})
    });
    if(res.status===401){window.location.href="/login?next=/read/"+encodeURIComponent(work.slug);return;}
    if(res.ok){const data=await res.json();setBookmarked(Boolean(data.bookmarked));}
  }

  async function speak(){
    if(!current || busy) return;
    if(playing){window.speechSynthesis.cancel();setPlaying(false);return;}
    setBusy(true);
    await saveProgress(current.sequence);
    try{
      const res=await fetch("/api/tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        text:current.text,language:work.language.slice(0,2).toLowerCase(),profile:"scripture"
      })});
      if(!res.ok) throw new Error("TTS unavailable");
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const audio=new Audio(url);
      audio.onended=()=>{setPlaying(false);URL.revokeObjectURL(url)};
      await audio.play();
      setPlaying(true);
    }catch{
      const utterance=new SpeechSynthesisUtterance(current.text);
      utterance.rate=0.88;
      utterance.onend=()=>setPlaying(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setPlaying(true);
    }finally{setBusy(false)}
  }

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link href="/library" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4"/>Library</Link>
      <div className="flex items-center gap-2 text-xs text-zinc-500"><Sparkles className="h-4 w-4 text-amber-300"/>Source-aware reader</div>
    </header>

    <div className="mx-auto grid max-w-6xl gap-5 px-5 pb-16 lg:grid-cols-[1fr_340px]">
      <section className="glass rounded-3xl p-7 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">{work.language} · {work.rightsStatus}</p>
            <h1 className="mt-2 font-display text-4xl">{work.title}</h1>
            <p className="mt-2 text-sm text-zinc-500">{work.edition||work.translator||"Primary text"}</p>
          </div>
          <button onClick={toggleBookmark} aria-label={bookmarked?"Remove bookmark":"Save book"} className={bookmarked?"rounded-xl border border-violet-300/20 bg-violet-300/[0.08] p-3 text-violet-200":"rounded-xl border border-white/10 p-3 text-zinc-500 hover:text-white"}><Bookmark className="h-5 w-5" fill={bookmarked?"currentColor":"none"}/></button>
        </div>

        <div className="mt-8 space-y-4">
          {work.passages.map(p=><button key={p.id} onClick={()=>{setActive(p.sequence);setPlaying(false);saveProgress(p.sequence)}} className={"w-full rounded-2xl border p-5 text-left transition "+(active===p.sequence?"border-amber-300/30 bg-amber-300/[0.06]":"border-white/5 bg-white/[0.02] hover:border-white/10")}>
            <div className="mb-2 text-xs text-zinc-600">{p.reference}</div>
            <div className="font-display text-lg leading-8 text-zinc-100">{p.text}</div>
          </button>)}
        </div>
      </section>

      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <div className="glass rounded-3xl p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-600">Listen</div>
          <div className="mt-3 font-display text-2xl">{current?.reference}</div>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{current?.text}</p>
          <button onClick={speak} disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-black disabled:opacity-50">
            {playing?<Pause className="h-4 w-4"/>:<Play className="h-4 w-4 fill-current"/>}{busy?"Preparing audio…":playing?"Playing":"Read aloud"}
          </button>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600"><Volume2 className="h-3.5 w-3.5"/>Narration profile: Scripture</div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-amber-300" style={{width:String(total?(active/total)*100:0)+"%"}}/></div>
          <div className="mt-2 text-xs text-zinc-600">{active} of {total} passages</div>
        </div>
        {work.source&&<div className="glass mt-4 rounded-3xl p-6"><div className="text-xs uppercase tracking-[0.18em] text-zinc-600">Source</div><div className="mt-2 font-display text-lg">{work.source.name}</div><div className="mt-2 text-sm text-zinc-500">{work.source.license||work.rightsStatus}</div><a href={work.source.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs text-zinc-300 hover:text-white">Open source →</a></div>}
      </aside>
    </div>
  </main>
}
