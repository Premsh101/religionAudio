"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookOpen, Headphones, Pause, Play, Sparkles, Volume2 } from "lucide-react";
import Link from "next/link";
import first20 from "../../../data/library/buddhism/dhammapada/dhp1-20_translation-en-sujato.json";
import AppHeader from "../../../components/AppHeader";

type PassageFile={passages:Record<string,string>};
const source=first20 as PassageFile;
const WORK_SLUG="dhammapada-sujato-en";
const TOTAL_VERSES=20;

function buildVerses(){
  const groups=new Map<number,string[]>();
  Object.entries(source.passages).forEach(([ref,value])=>{
    const match=ref.match(/^dhp(\d+):(\d+)$/);
    if(!match || !value || /^dhp\d+:0$/.test(ref)) return;
    const verse=Number(match[1]);
    const line=Number(match[2]);
    const clean=value.replace(/<[^>]+>/g,"").replace(/^["“]|["”]$/g,"").trim();
    const lines=groups.get(verse)||[];
    lines[line-1]=clean;
    groups.set(verse,lines);
  });
  return [...groups.entries()]
    .sort((a,b)=>a[0]-b[0])
    .map(([number,lines])=>({number,text:lines.filter(Boolean).join(" ")}));
}

export default function DhammapadaReader(){
  const verses=useMemo(buildVerses,[]);
  const [active,setActive]=useState(1);
  const [playing,setPlaying]=useState(false);
  const [busy,setBusy]=useState(false);
  const [bookmarked,setBookmarked]=useState(false);
  const current=verses.find(v=>v.number===active)||verses[0];

  useEffect(()=>{
    async function load(){
      const [progressRes,bookmarkRes]=await Promise.all([
        fetch("/api/user/progress"),
        fetch("/api/user/bookmarks")
      ]);
      if(progressRes.ok){
        const data=await progressRes.json();
        const progress=data.works?.find((item:any)=>item.work?.slug===WORK_SLUG);
        if(progress?.currentSequence) setActive(Math.min(TOTAL_VERSES,Math.max(1,progress.currentSequence)));
      }
      if(bookmarkRes.ok){
        const data=await bookmarkRes.json();
        setBookmarked(Boolean(data.bookmarks?.some((item:any)=>item.work?.slug===WORK_SLUG)));
      }
    }
    load().catch(()=>{});
  },[]);

  async function saveProgress(sequence:number){
    try{
      await fetch("/api/user/progress",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          kind:"work",
          targetSlug:WORK_SLUG,
          sequence,
          progressPercent:(sequence/TOTAL_VERSES)*100,
          completed:sequence>=TOTAL_VERSES
        })
      });
    }catch{}
  }

  async function toggleBookmark(){
    const res=await fetch("/api/user/bookmarks",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({targetType:"work",targetKey:WORK_SLUG})
    });
    if(res.status===401){
      window.location.href="/login?next=/read/dhammapada";
      return;
    }
    if(res.ok){
      const data=await res.json();
      setBookmarked(Boolean(data.bookmarked));
    }
  }

  async function speak(){
    if(!current || busy) return;
    if(playing){window.speechSynthesis.cancel();setPlaying(false);return;}
    setBusy(true);
    await saveProgress(current.number);
    try{
      const res=await fetch("/api/tts",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({text:current.text,language:"en",profile:"scripture"})
      });
      if(!res.ok) throw new Error("TTS service unavailable");
      const {url}=await res.json();
      if(!url) throw new Error("TTS service unavailable");
      const audio=new Audio(url);
      audio.onended=()=>setPlaying(false);
      await audio.play();
      setPlaying(true);
    }catch{
      const utterance=new SpeechSynthesisUtterance(current.text);
      utterance.rate=0.88;
      utterance.pitch=0.92;
      utterance.onend=()=>setPlaying(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setPlaying(true);
    }finally{setBusy(false)}
  }

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link href="/library" className="text-sm text-zinc-500 hover:text-white">← Library</Link>
      <div className="flex items-center gap-2 text-xs text-zinc-500"><Sparkles className="h-4 w-4 text-amber-300"/> CC0 translation · SuttaCentral</div>
    </header>

    <div className="mx-auto grid max-w-6xl gap-5 px-5 pb-16 lg:grid-cols-[1fr_340px]">
      <section className="glass rounded-3xl p-7 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-amber-300">Buddhism · Khuddaka Nikaya</p><h1 className="mt-2 font-display text-4xl">Dhammapada</h1><p className="mt-2 text-sm text-zinc-500">English translation by Bhikkhu Sujato</p></div>
          <button onClick={toggleBookmark} aria-label={bookmarked?"Remove bookmark":"Save book"} className={bookmarked?"rounded-xl border border-violet-300/20 bg-violet-300/[0.08] p-3 text-violet-200":"rounded-xl border border-white/10 bg-white/[0.02] p-3 text-zinc-500 hover:text-white"}><Bookmark className="h-5 w-5" fill={bookmarked?"currentColor":"none"}/></button>
        </div>

        <div className="mt-8 space-y-4">
          {verses.map(v=><button key={v.number} onClick={()=>{setActive(v.number);setPlaying(false);saveProgress(v.number)}} className={"w-full rounded-2xl border p-5 text-left transition "+(active===v.number?"border-amber-300/30 bg-amber-300/[0.06]":"border-white/5 bg-white/[0.02] hover:border-white/10")}>
            <div className="mb-2 text-xs text-zinc-600">{v.number}</div>
            <div className="font-display text-lg leading-8 text-zinc-100">{v.text}</div>
          </button>)}
        </div>
      </section>

      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <div className="glass rounded-3xl p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-600">Listen</div>
          <div className="mt-3 font-display text-2xl">Verse {current?.number}</div>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{current?.text}</p>
          <button onClick={speak} disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-black disabled:opacity-50">
            {playing?<Pause className="h-4 w-4"/>:<Play className="h-4 w-4 fill-current"/>}{busy?"Preparing audio…":playing?"Playing":"Read aloud"}
          </button>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600"><Volume2 className="h-3.5 w-3.5"/>Narration profile: Scripture</div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-amber-300" style={{width:String((active/TOTAL_VERSES)*100)+"%"}}/></div>
          <div className="mt-2 text-xs text-zinc-600">{active} of {TOTAL_VERSES} sample verses</div>
        </div>

        <div className="glass mt-4 rounded-3xl p-6">
          <div className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-violet-300"/> Ask the text</div>
          <textarea placeholder="What does this passage mean? What does the tradition say? What does scholarship say?" className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 outline-none placeholder:text-zinc-600"/>
          <button className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">Ask AI</button>
        </div>

        <div className="mt-4 rounded-3xl border border-violet-300/10 bg-violet-300/[0.04] p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-violet-300"><Headphones className="h-3.5 w-3.5"/> Your progress</div>
          <p className="mt-3 text-sm leading-6 text-zinc-500">Sign in to keep your place and save this book to your personal shelf.</p>
          {!bookmarked && <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600"><BookOpen className="h-3.5 w-3.5"/>Your reading position is synced when you are signed in.</div>}
        </div>
      </aside>
    </div>
  </main>
}
