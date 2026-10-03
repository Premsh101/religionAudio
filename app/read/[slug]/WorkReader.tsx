"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronLeft, Pause, Play } from "lucide-react";
import AppHeader from "../../../components/AppHeader";
import SiteFooter from "../../../components/SiteFooter";
import { useVoicePreference, type NarrationAssets } from "../../../components/NarrationPlayer";
import { useNarration } from "../../../components/player/useNarration";
import { useT } from "../../../components/AppProvider";
import { recordHistory } from "../../../lib/client/history";

type Line={id:string;reference:string;sequence:number;text:string};
type Verse={key:string;number:string;lines:Line[]};
type Chapter={n:number;name:string|null};
type Work={id:string;title:string;slug:string;language:string;translator:string|null;edition:string|null;rightsStatus:string;source:{name:string;url:string;license:string|null}|null;verses:Verse[];chapters:Chapter[];currentChapter:number;audio:NarrationAssets;totalPassages:number;initialSequence:number|null;coverUrl:string|null;summary:string|null};

/** Letters only, so a verse can be found inside a narration part's transcript whatever the punctuation. */
const plain=(s:string)=>s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu," ").trim();

export default function WorkReader({work}:{work:Work}){
  const t=useT();
  const lines=work.verses.flatMap(v=>v.lines);
  const initial=work.initialSequence?work.verses.find(v=>v.lines.some(l=>l.sequence===work.initialSequence)):undefined;
  const [active,setActive]=useState<string>(initial?.key||work.verses[0]?.key||"");
  const [voice]=useVoicePreference();
  const [speaking,setSpeaking]=useState<string|null>(null);
  const [bookmarked,setBookmarked]=useState(false);
  const [font,setFont]=useState(21);
  const audioRef=useRef<HTMLAudioElement|null>(null);
  // Progress is measured against the whole book, not just the chapter on screen.
  const total=work.totalPassages||lines.length;
  const index=work.chapters.findIndex(c=>c.n===work.currentChapter);
  const previous=index>0?work.chapters[index-1]:null;
  const next=index>=0&&index<work.chapters.length-1?work.chapters[index+1]:null;
  const chapter=work.chapters[index];
  const chapterTitle=(c:Chapter)=>c.name?`${c.n}. ${c.name}`:t("reader.chapter",{n:c.n});
  const chapterHref=(n:number)=>"/read/"+work.slug+"?chapter="+n;
  const historyTarget={kind:"work" as const,id:work.id,slug:work.slug,title:work.title,href:"/read/"+work.slug};
  const n=useNarration({workId:work.id,assets:work.audio,item:{title:work.title,href:"/read/"+work.slug,coverUrl:work.coverUrl,target:historyTarget}});
  const p=n.player;

  useEffect(()=>{recordHistory(historyTarget)},[work.id]);// eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{try{const f=Number(localStorage.getItem("sv-reader-font"));if(f>=16&&f<=30)setFont(f)}catch{}},[]);
  useEffect(()=>{
    Promise.all([fetch("/api/user/progress"),fetch("/api/user/bookmarks")]).then(async([progressRes,bookmarkRes])=>{
      if(progressRes.ok&&!work.initialSequence){
        const data=await progressRes.json();
        const item=data.works?.find((row:{work?:{slug:string};currentSequence?:number})=>row.work?.slug===work.slug);
        const verse=item?.currentSequence?work.verses.find(v=>v.lines.some(l=>l.sequence===item.currentSequence)):undefined;
        if(verse)setActive(verse.key);
      }
      if(bookmarkRes.ok){const data=await bookmarkRes.json();setBookmarked(Boolean(data.bookmarks?.some((row:{work?:{slug:string}})=>row.work?.slug===work.slug)))}
    }).catch(()=>{});
  },[work.slug]);// eslint-disable-line react-hooks/exhaustive-deps

  // While the book narration plays, highlight the verses the current part is reading.
  const verseText=useMemo(()=>new Map(work.verses.map(v=>[v.key,plain(v.lines.map(l=>l.text).join(" "))])),[work.verses]);
  const transcript=n.isCurrent?plain(p.segments[p.index]?.transcript||""):"";
  const narrating=new Set(transcript?work.verses.filter(v=>{const text=verseText.get(v.key)||"";return text.length>3&&transcript.includes(text.slice(0,60))}).map(v=>v.key):[]);

  const changeFont=(d:number)=>setFont(f=>{const v=Math.min(30,Math.max(16,f+d));try{localStorage.setItem("sv-reader-font",String(v))}catch{};return v});

  async function saveProgress(sequence:number){
    recordHistory({...historyTarget,progressPercent:total?(sequence/total)*100:0,completed:sequence>=total,passageSequence:sequence});
    try{await fetch("/api/user/progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"work",targetSlug:work.slug,sequence,progressPercent:total?(sequence/total)*100:0,completed:sequence>=total})})}catch{}
  }

  async function toggleBookmark(){
    const res=await fetch("/api/user/bookmarks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetType:"work",targetKey:work.slug})});
    if(res.status===401){window.location.href="/login?next=/read/"+encodeURIComponent(work.slug);return}
    if(res.ok){const data=await res.json();setBookmarked(Boolean(data.bookmarked))}
  }

  /** Tapping a verse continues the book narration from there; without it, the verse is read aloud on its own. */
  async function listenFrom(verse:Verse){
    setActive(verse.key);
    void saveProgress(verse.lines[0].sequence);
    const text=verseText.get(verse.key)||"";
    if(n.isCurrent&&p.segments.length){
      const i=p.segments.findIndex(s=>plain(s.transcript||"").includes(text.slice(0,60)));
      if(i>=0){p.choose(i);if(!p.playing)p.toggle();return}
    }
    audioRef.current?.pause();window.speechSynthesis?.cancel();
    if(speaking===verse.key){setSpeaking(null);return}
    if(n.playing)p.toggle();
    const spoken=verse.lines.map(l=>l.text.trim()).join(" ");
    setSpeaking(verse.key);
    try{
      const res=await fetch("/api/tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:spoken,language:work.language.slice(0,2).toLowerCase(),profile:"scripture",voice})});
      const {url}=res.ok?await res.json():{url:null};
      if(!url)throw new Error("TTS unavailable");
      const audio=new Audio(url);audioRef.current=audio;
      audio.onended=()=>setSpeaking(null);
      await audio.play();
    }catch{
      const u=new SpeechSynthesisUtterance(spoken);u.rate=0.9;u.onend=()=>setSpeaking(null);
      window.speechSynthesis.cancel();window.speechSynthesis.speak(u);
    }
  }

  const activeLine=work.verses.find(v=>v.key===active)?.lines[0].sequence||lines[0]?.sequence||1;

  return <main className="min-h-screen">
    <AppHeader/>
    <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-[18px] pb-12 pt-6 min-[760px]:px-10 min-[1000px]:grid-cols-[200px_1fr]">
      <aside className="min-[1000px]:sticky min-[1000px]:top-24 min-[1000px]:h-fit">
        <Link href="/library?tab=books" className="inline-flex items-center gap-1.5 rounded-full bg-chip px-4 py-2 text-sm font-bold hover:bg-line2"><ChevronLeft className="h-4 w-4 rtl:rotate-180"/>{t("nav.library")}</Link>
        {work.chapters.length>1&&<><p className="eyebrow mt-6 text-mut2">{t("reader.chapters")}</p>
        <nav className="scrollbar-hide mt-3 flex gap-1 overflow-x-auto min-[1000px]:max-h-[70vh] min-[1000px]:flex-col min-[1000px]:overflow-y-auto">{work.chapters.map(c=><Link key={c.n} href={chapterHref(c.n)} className={"shrink-0 rounded-xl px-3 py-2 text-sm font-bold transition "+(c.n===work.currentChapter?"bg-hl text-ink":"text-mut hover:text-ink")}>{chapterTitle(c)}</Link>)}</nav></>}
      </aside>

      <section className="min-w-0">
        <div className="sticky top-[70px] z-20 flex items-center gap-2 rounded-full border border-line2 bg-card/95 p-2 ps-5 shadow-card backdrop-blur min-[760px]:top-[86px]">
          <span className="min-w-0 flex-1 truncate text-sm font-bold">{work.title}{chapter?` · ${chapter.name||t("reader.chapter",{n:chapter.n})}`:""}</span>
          <button onClick={()=>changeFont(-2)} aria-label={t("reader.smaller")} className="flex h-9 w-9 items-center justify-center rounded-full bg-chip text-xs font-extrabold">A</button>
          <button onClick={()=>changeFont(2)} aria-label={t("reader.larger")} className="flex h-9 w-9 items-center justify-center rounded-full bg-chip text-base font-extrabold">A</button>
          <button onClick={toggleBookmark} aria-pressed={bookmarked} aria-label={t("story.save")} className="flex h-9 w-9 items-center justify-center rounded-full bg-chip"><Bookmark className="h-4 w-4" fill={bookmarked?"currentColor":"none"}/></button>
          <button onClick={()=>void n.play()} disabled={n.busy} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60" style={{background:"linear-gradient(135deg,#7B61FF,#B061FF)"}}>{n.playing?<Pause className="h-4 w-4 fill-current"/>:<Play className="h-4 w-4 fill-current"/>}{n.busy?t("story.starting"):n.playing?t("story.pause"):t("reader.listen")}</button>
        </div>
        {n.error&&<p className="mt-3 text-sm font-semibold text-coral">{n.error==="unavailable"?t("story.unavailable"):n.error}</p>}
        {n.isCurrent&&p.preparing&&<p className="mt-3 text-sm text-mut">{t("story.preparing",{done:p.preparing.done,total:p.preparing.total||"…"})} {t("story.firstTime")}</p>}

        <p className="eyebrow mt-8 text-purple">{[work.title,work.edition||work.translator].filter(Boolean).join(" · ")}</p>
        <h1 className="mt-2 font-display text-[44px] leading-none tracking-[-.02em] min-[760px]:text-[60px]">{chapter?.name?`${chapter.n}. ${chapter.name}`:chapter?`${work.title} ${chapter.n}`:work.title}</h1>
        <p className="mt-3 text-sm text-mut">{[work.translator?`Translated by ${work.translator}`:null,work.source?.license,work.source?.name].filter(Boolean).join(" · ")}</p>
        <p className="mt-1 text-xs text-mut2">{t("reader.tapToListen")}</p>

        <div className="mt-8 space-y-1">
          {work.verses.map(v=>{
            const on=narrating.size?narrating.has(v.key):active===v.key;
            return <button key={v.key} onClick={()=>void listenFrom(v)} className={"grid w-full grid-cols-[44px_1fr] gap-2 rounded-2xl px-2 py-5 text-start transition min-[760px]:grid-cols-[56px_1fr] "+(on||speaking===v.key?"bg-hl":"hover:bg-chip")}>
              <span className="pt-2 text-xs font-extrabold tabular-nums text-mut2">{v.number}</span>
              <span className="font-display leading-[1.55] text-ink" style={{fontSize:font}}>{v.lines.map(l=><span key={l.id} className="block">{l.text.trim()}</span>)}</span>
            </button>;
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          {previous?<Link href={chapterHref(previous.n)} className="btn-outline !py-3">← {t("reader.prev")}</Link>:<span/>}
          <span className="text-xs font-bold text-mut2">{t("reader.passages",{a:activeLine,b:total})}</span>
          {next?<Link href={chapterHref(next.n)} className="btn-outline !py-3">{t("reader.next")} →</Link>:<span/>}
        </div>
      </section>
    </div>
    <SiteFooter/>
  </main>;
}
