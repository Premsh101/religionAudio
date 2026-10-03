"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronLeft, Pause, Play } from "lucide-react";
import AppHeader from "../../../components/AppHeader";
import SiteFooter from "../../../components/SiteFooter";
import { useVoicePreference, type NarrationAssets } from "../../../components/NarrationPlayer";
import { useNarration } from "../../../components/player/useNarration";
import { useT } from "../../../components/AppProvider";
import { recordHistory } from "../../../lib/client/history";

type Passage={id:string;reference:string;sequence:number;text:string};
type Work={id:string;title:string;slug:string;language:string;translator:string|null;edition:string|null;rightsStatus:string;source:{name:string;url:string;license:string|null}|null;passages:Passage[];chapters:number[];currentChapter:number;audio:NarrationAssets;totalPassages:number;initialSequence:number|null;coverUrl:string|null;summary:string|null};

export default function WorkReader({work}:{work:Work}){
  const [active,setActive]=useState(work.initialSequence&&work.passages.some(p=>p.sequence===work.initialSequence)?work.initialSequence:(work.passages[0]?.sequence||1));
  const [voice,setVoice]=useVoicePreference();
  const [playing,setPlaying]=useState(false);
  const [busy,setBusy]=useState(false);
  const [bookmarked,setBookmarked]=useState(false);
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const t=useT();
  // Progress is measured against the whole book, not just the chapter on screen.
  const total=work.totalPassages||work.passages.length;
  const currentChapterIndex=work.chapters.indexOf(work.currentChapter);
  const previousChapter=currentChapterIndex>0?work.chapters[currentChapterIndex-1]:null;
  const nextChapter=currentChapterIndex>=0&&currentChapterIndex<work.chapters.length-1?work.chapters[currentChapterIndex+1]:null;

  const historyTarget={kind:"work" as const,id:work.id,slug:work.slug,title:work.title,href:"/read/"+work.slug};
  useEffect(()=>{recordHistory(historyTarget);},[work.id]);

  useEffect(()=>{
    async function load(){
      const [progressRes,bookmarkRes]=await Promise.all([
        fetch("/api/user/progress"),
        fetch("/api/user/bookmarks")
      ]);
      if(progressRes.ok){
        const data=await progressRes.json();
        const item=data.works?.find((row:any)=>row.work?.slug===work.slug);
        // An explicit resume link (?at=) wins; otherwise jump to the saved passage if it is in this chapter.
        if(!work.initialSequence&&item?.currentSequence&&work.passages.some((p:{sequence:number})=>p.sequence===item.currentSequence)) setActive(item.currentSequence);
      }
      if(bookmarkRes.ok){
        const data=await bookmarkRes.json();
        setBookmarked(Boolean(data.bookmarks?.some((row:any)=>row.work?.slug===work.slug)));
      }
    }
    load().catch(()=>{});
  },[work.slug,total]);

  async function saveProgress(sequence:number){
    recordHistory({...historyTarget,progressPercent:total?(sequence/total)*100:0,completed:sequence>=total,passageSequence:sequence});
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

  async function speak(passage:Passage){
    const current=passage;
    if(busy) return;
    audioRef.current?.pause();window.speechSynthesis.cancel();
    setBusy(true);
    try{
      const res=await fetch("/api/tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        text:current.text,language:work.language.slice(0,2).toLowerCase(),profile:"scripture",voice
      })});
      if(!res.ok) throw new Error("TTS unavailable");
      const {url}=await res.json();
      if(!url) throw new Error("TTS unavailable");
      const audio=new Audio(url);
      audioRef.current=audio;
      audio.onended=()=>setPlaying(false);
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

  const [font,setFont]=useState(21);
  useEffect(()=>{try{const f=Number(localStorage.getItem("sv-reader-font"));if(f>=16&&f<=30)setFont(f)}catch{}},[]);
  const changeFont=(d:number)=>setFont(f=>{const next=Math.min(30,Math.max(16,f+d));try{localStorage.setItem("sv-reader-font",String(next))}catch{};return next});
  const chapterHref=(ch:number)=>"/read/"+work.slug+"?chapter="+ch;
  const n=useNarration({workId:work.id,assets:work.audio,item:{title:work.title,href:"/read/"+work.slug,coverUrl:work.coverUrl,target:historyTarget}});

  return <main className="min-h-screen">
    <AppHeader/>
    <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-[18px] pb-12 pt-6 min-[760px]:px-10 min-[1000px]:grid-cols-[200px_1fr]">
      <aside className="min-[1000px]:sticky min-[1000px]:top-24 min-[1000px]:h-fit">
        <Link href="/library?tab=books" className="inline-flex items-center gap-1.5 rounded-full bg-chip px-4 py-2 text-sm font-bold hover:bg-line2"><ChevronLeft className="h-4 w-4 rtl:rotate-180"/>{t("nav.library")}</Link>
        {work.chapters.length>1&&<><p className="eyebrow mt-6 text-mut2">{t("reader.chapters")}</p>
        <nav className="scrollbar-hide mt-3 flex gap-1 overflow-x-auto min-[1000px]:flex-col">{work.chapters.map(ch=><Link key={ch} href={chapterHref(ch)} className={"shrink-0 rounded-xl px-3 py-2 text-sm font-bold transition "+(ch===work.currentChapter?"bg-hl text-ink":"text-mut hover:text-ink")}>{t("reader.chapter",{n:ch})}</Link>)}</nav></>}
      </aside>

      <section className="min-w-0">
        <div className="sticky top-[70px] z-20 flex items-center gap-2 rounded-full border border-line2 bg-card/95 p-2 ps-5 shadow-card backdrop-blur min-[760px]:top-[86px]">
          <span className="min-w-0 flex-1 truncate text-sm font-bold">{work.title} · {t("reader.chapter",{n:work.currentChapter})}</span>
          <button onClick={()=>changeFont(-2)} aria-label={t("reader.smaller")} className="flex h-9 w-9 items-center justify-center rounded-full bg-chip text-xs font-extrabold">A</button>
          <button onClick={()=>changeFont(2)} aria-label={t("reader.larger")} className="flex h-9 w-9 items-center justify-center rounded-full bg-chip text-base font-extrabold">A</button>
          <button onClick={toggleBookmark} aria-pressed={bookmarked} aria-label={t("story.save")} className="flex h-9 w-9 items-center justify-center rounded-full bg-chip"><Bookmark className="h-4 w-4" fill={bookmarked?"currentColor":"none"}/></button>
          <button onClick={()=>void n.play()} disabled={n.busy} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60" style={{background:"linear-gradient(135deg,#7B61FF,#B061FF)"}}>{n.playing?<Pause className="h-4 w-4 fill-current"/>:<Play className="h-4 w-4 fill-current"/>}{n.busy?t("story.starting"):n.playing?t("story.pause"):t("reader.listen")}</button>
        </div>
        {n.error&&<p className="mt-3 text-sm font-semibold text-coral">{n.error==="unavailable"?t("story.unavailable"):n.error}</p>}
        {n.isCurrent&&n.player.preparing&&<p className="mt-3 text-sm text-mut">{t("story.preparing",{done:n.player.preparing.done,total:n.player.preparing.total||"…"})} {t("story.firstTime")}</p>}

        <p className="eyebrow mt-8 text-purple">{[work.language,work.edition||work.translator].filter(Boolean).join(" · ")}</p>
        <h1 className="mt-2 font-display text-[44px] leading-none tracking-[-.02em] min-[760px]:text-[60px]">{work.chapters.length>1?`${work.currentChapter}. ${work.title}`:work.title}</h1>
        {(work.summary||work.source)&&<p className="mt-3 text-sm text-mut">{work.summary||[work.source?.name,work.source?.license].filter(Boolean).join(" · ")}</p>}
        <p className="mt-2 text-xs text-mut2">{t("reader.tapToListen")}</p>

        <div className="mt-8 space-y-2">
          {work.passages.map(p=><button key={p.id} onClick={()=>{setActive(p.sequence);void saveProgress(p.sequence);void speak(p)}} className={"grid w-full grid-cols-[44px_1fr] gap-2 rounded-2xl px-2 py-4 text-start transition min-[760px]:grid-cols-[56px_1fr] "+(active===p.sequence?"bg-hl":"hover:bg-chip")}>
            <span className="pt-1.5 text-xs font-extrabold text-mut2">{p.reference.split(":").pop()}</span>
            <span className="whitespace-pre-line font-display leading-[1.55] text-ink" style={{fontSize:font}}>{p.text}</span>
          </button>)}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          {previousChapter?<Link href={chapterHref(previousChapter)} className="btn-outline !py-3">← {t("reader.prev")}</Link>:<span/>}
          <span className="text-xs font-bold text-mut2">{t("reader.passages",{a:active,b:total})}</span>
          {nextChapter?<Link href={chapterHref(nextChapter)} className="btn-outline !py-3">{t("reader.next")} →</Link>:<span/>}
        </div>
      </section>
    </div>
    <SiteFooter/>
  </main>
}
