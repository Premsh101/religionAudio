"use client";

import { useMemo, useState } from "react";
import { BookOpen, Headphones, Pause, Play, Sparkles, Volume2 } from "lucide-react";

import first20 from "../../../data/library/buddhism/dhammapada/dhp1-20_translation-en-sujato.json";

type PassageFile={passages:Record<string,string>};
const source=first20 as PassageFile;

function buildVerses() {
  const groups=new Map<number,string[]>();
  Object.entries(source.passages).forEach(([ref,value]) => {
    const match=ref.match(/^dhp(\d+):(\d+)$/);
    if(!match || !value || /^dhp\d+:0$/.test(ref)) return;
    const verse=Number(match[1]);
    const line=Number(match[2]);
    const clean=value.replace(/<[^>]+>/g,"").replace(/^["“]|["”]$/g,"").trim();
    const lines=groups.get(verse) || [];
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
  const current=verses.find(v=>v.number===active) || verses[0];

  async function speak(){
    if(!current || busy) return;
    if(playing){setPlaying(false);return;}
    setBusy(true);
    try{
      const res=await fetch("/api/tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        text:current.text,
        language:"en",
        profile:"scripture"
      })});
      if(!res.ok) throw new Error("TTS service unavailable");
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const audio=new Audio(url);
      audio.onended=()=>{setPlaying(false);URL.revokeObjectURL(url)};
      await audio.play();
      setPlaying(true);
    }catch(err){
      console.error(err);
      alert("Local TTS is not configured yet. Start services/tts and add a licensed voice model.");
    }finally{setBusy(false)}
  }

  return <main className="min-h-screen bg-zinc-950">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <a href="/" className="text-sm text-zinc-500 hover:text-white">← Sacred Stories</a>
      <div className="flex items-center gap-2 text-xs text-zinc-500"><Sparkles className="h-4 w-4 text-amber-300"/> CC0 translation · SuttaCentral</div>
    </header>

    <div className="mx-auto grid max-w-6xl gap-5 px-5 pb-16 lg:grid-cols-[1fr_340px]">
      <section className="glass rounded-3xl p-7 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-amber-300">Buddhism · Khuddaka Nikaya</p><h1 className="mt-2 font-display text-4xl">Dhammapada</h1><p className="mt-2 text-sm text-zinc-500">English translation by Bhikkhu Sujato</p></div>
          <BookOpen className="h-6 w-6 text-zinc-600"/>
        </div>

        <div className="mt-8 space-y-4">
          {verses.map(v=><button key={v.number} onClick={()=>{setActive(v.number);setPlaying(false)}} className={`w-full rounded-2xl border p-5 text-left transition ${active===v.number?"border-amber-300/30 bg-amber-300/[0.06]":"border-white/5 bg-white/[0.02] hover:border-white/10"}`}>
            <div className="mb-2 text-xs text-zinc-600">{v.number}</div>
            <div className="font-display text-lg leading-8 text-zinc-100">{v.text}</div>
          </button>)}
        </div>
      </section>

      <aside className="lg:sticky lg:top-5 lg:h-fit">
        <div className="glass rounded-3xl p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-600">Listen</div>
          <div className="mt-3 font-display text-2xl">Verse {current?.number}</div>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{current?.text}</p>
          <button onClick={speak} disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-black disabled:opacity-50">
            {playing?<Pause className="h-4 w-4"/>:<Play className="h-4 w-4 fill-current"/>}{busy?"Preparing audio…":playing?"Playing":"Read aloud"}
          </button>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600"><Volume2 className="h-3.5 w-3.5"/>Narration profile: Scripture</div>
        </div>

        <div className="glass mt-4 rounded-3xl p-6">
          <div className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-violet-300"/> Ask the text</div>
          <textarea placeholder="What does this passage mean? What does the tradition say? What does scholarship say?" className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 outline-none placeholder:text-zinc-600"/>
          <button className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">Ask AI</button>
        </div>

        <div className="mt-4 rounded-3xl border border-violet-300/10 bg-violet-300/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-violet-300">Evidence layers</div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-500"><span className="rounded-xl bg-black/20 p-3">Text</span><span className="rounded-xl bg-black/20 p-3">Tradition</span><span className="rounded-xl bg-black/20 p-3">Scholarship</span><span className="rounded-xl bg-black/20 p-3">Science</span></div>
        </div>
      </aside>
    </div>
  </main>
}
