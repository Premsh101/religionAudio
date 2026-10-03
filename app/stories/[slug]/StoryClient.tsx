"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, ChevronLeft, Moon, Pause, Play, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import AppHeader from "../../../components/AppHeader";
import SiteFooter from "../../../components/SiteFooter";
import { Cover } from "../../../components/StoryTile";
import { VoiceToggle, type NarrationAssets } from "../../../components/NarrationPlayer";
import Waveform from "../../../components/player/Waveform";
import { formatTime } from "../../../components/player/PlayerProvider";
import { useNarration } from "../../../components/player/useNarration";
import { recordHistory } from "../../../lib/client/history";
import { useApp } from "../../../components/AppProvider";
import { CATEGORY_STYLE, categoryLabelKey, fallbackCover, type CategoryKey } from "../../../lib/categories";

type Story={title:string;slug:string;content_type:string;audience:string;age_min:number;age_max:number;tag:string;narration_profile:string;style_notes:string;body:string;status:string;storyId?:string;audio?:NarrationAssets;audioByLanguage?:Record<string,NarrationAssets>;language?:string;translations?:Record<string,string>;mature?:boolean;previewStatus?:string|null;coverUrl?:string|null;source?:{name:string;url:string;license:string|null;rightsStatus:string}|null;category:CategoryKey};

const LANG_NAMES:Record<string,string>={en:"English",hi:"हिन्दी",ar:"العربية",ur:"اردو"};
const VOICE_LABEL:Record<string,string>={ghost:"Atmospheric",mythology:"Cinematic",folklore:"Oral storytelling",kids:"Warm & playful","moral-tale":"Bright",scripture:"Calm",mystery:"Composed",thriller:"Taut",romance:"Tender",sensual:"Intimate",documentary:"Documentary",inspirational:"Uplifting",devotional:"Serene",adventure:"Vivid"};

export default function StoryClient({story}:{story:Story}){
  const {t,locale}=useApp();
  const router=useRouter();
  const params=useSearchParams();
  const [bookmarked,setBookmarked]=useState(false);
  const baseLang=story.language||"en";
  const languages=[baseLang,...(["en","hi","ar","ur"] as const).filter(l=>l!==baseLang&&story.translations?.[l])];
  // Open the story in the visitor's language when a translation exists.
  const [lang,setLang]=useState(languages.includes(locale)?locale:baseLang);
  const shownBody=lang===baseLang?story.body:(story.translations?.[lang]||story.body);
  const rtl=lang==="ar"||lang==="ur";
  const titleOk=story.translations?.["title_"+locale]&&(!story.translations?.title_src||story.translations.title_src===story.title);
  const shownTitle=locale!==baseLang&&titleOk?story.translations!["title_"+locale]:story.title;
  // Narration exists in English and Hindi; Arabic and Urdu readers hear the English narration.
  const narrationLang=lang==="hi"||lang===baseLang?lang:(locale==="hi"&&story.translations?.hi?"hi":baseLang);
  const href="/stories/"+story.slug;
  const coverUrl=story.coverUrl||fallbackCover(story.category,story.slug);
  const historyTarget=story.storyId?{kind:"story" as const,id:story.storyId,slug:story.slug,title:story.title,href}:undefined;
  const minutes=Math.max(1,Math.round(story.body.length/870));
  const color=CATEGORY_STYLE[story.category].color;

  const n=useNarration({storyId:story.storyId,language:narrationLang,assets:story.audioByLanguage?.[narrationLang]||story.audio||{},item:{title:shownTitle,href,coverUrl,target:historyTarget}});
  const p=n.player;
  const live=n.isCurrent;
  const progress=live&&p.duration?Math.min(1,p.elapsed/p.duration):0;
  const segmentsInLang=live&&p.segments.length>0&&lang===narrationLang;

  useEffect(()=>{if(historyTarget)recordHistory(historyTarget)},[story.storyId]);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    fetch("/api/user/bookmarks").then(r=>r.ok?r.json():null).then(d=>{if(d)setBookmarked(Boolean(d.bookmarks?.some((row:{story?:{slug:string}})=>row.story?.slug===story.slug)))}).catch(()=>{});
  },[story.slug]);

  // "Listen" on the home banner opens this page with ?play=1.
  const autoplayed=useRef(false);
  useEffect(()=>{
    if(params.get("play")==="1"&&!autoplayed.current&&story.storyId){autoplayed.current=true;if(!n.playing)void n.play();router.replace(href,{scroll:false})}
  });// eslint-disable-line react-hooks/exhaustive-deps

  async function toggleBookmark(){
    const res=await fetch("/api/user/bookmarks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetType:"story",targetKey:story.slug})});
    if(res.status===401){window.location.href="/login?next="+encodeURIComponent(href);return}
    if(res.ok){const data=await res.json();setBookmarked(Boolean(data.bookmarked))}
  }

  const playLabel=n.busy?t("story.starting"):n.playing?t("story.pause"):live&&p.elapsed>1?t("story.resume"):t("story.play");
  const paragraphs=shownBody.split(/\n{2,}|\n/).map(s=>s.trim()).filter(Boolean);
  // Narration parts span several paragraphs: highlight the ones the current part is reading, and let a tap jump there.
  const plain=(x:string)=>x.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu," ").trim();
  const transcript=segmentsInLang?plain(p.segments[p.index]?.transcript||""):"";
  const reading=(para:string)=>Boolean(transcript)&&transcript.includes(plain(para).slice(0,60));
  const jumpTo=(para:string)=>{
    if(!segmentsInLang)return;
    const key=plain(para).slice(0,60);
    const i=p.segments.findIndex(seg=>plain(seg.transcript||"").includes(key));
    if(i>=0){p.choose(i);if(!p.playing)p.toggle()}
  };

  return <main className="min-h-screen">
    <AppHeader/>
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] overflow-hidden" aria-hidden>
        <img src={coverUrl} alt="" className="h-full w-full scale-110 object-cover opacity-45 blur-[50px]"/>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--bg)_60%,transparent)] to-bg"/>
      </div>

      <section className="relative mx-auto w-full max-w-[1180px] px-[18px] pb-10 pt-6 min-[760px]:px-10">
        <button onClick={()=>window.history.length>1?router.back():router.push("/stories")} className="inline-flex items-center gap-1.5 rounded-full bg-chip px-4 py-2 text-sm font-bold text-ink backdrop-blur hover:bg-line2"><ChevronLeft className="h-4 w-4 rtl:rotate-180"/>{t("story.back")}</button>

        <div className="mt-6 grid items-end gap-8 min-[900px]:grid-cols-[340px_1fr]">
          <div className="mx-auto w-[240px] min-[900px]:w-full"><Cover title={shownTitle} category={story.category} coverUrl={coverUrl} seed={story.slug} size="lg" tag=""/></div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
              <span className="rounded-full px-3 py-1.5 text-white" style={{background:color}}>{t(categoryLabelKey(story.category))}</span>
              {story.mature&&<span className="rounded-full bg-coral px-3 py-1.5 text-white">18+</span>}
              {story.previewStatus&&<span className="rounded-full bg-chip px-3 py-1.5">{t("story.preview")} · {story.previewStatus.toLowerCase()}</span>}
              {story.age_min>0&&<span className="rounded-full bg-chip px-3 py-1.5">{t("stories.ages",{age:story.age_min})}</span>}
              <span className="rounded-full bg-chip px-3 py-1.5">{minutes} min</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-3 py-1.5"><Volume2 className="h-3.5 w-3.5"/>{VOICE_LABEL[story.narration_profile]||"Natural"}</span>
            </div>
            <h1 dir="auto" className="mt-4 font-display text-[44px] leading-[.98] tracking-[-.02em] min-[760px]:text-[64px]" style={{textWrap:"balance"} as React.CSSProperties}>{shownTitle}</h1>
            {story.style_notes&&<p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-mut">{story.style_notes}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {story.storyId&&<button onClick={()=>void n.play()} disabled={n.busy} className="btn-primary">{n.playing?<Pause className="h-4 w-4 fill-current"/>:<Play className="h-4 w-4 fill-current"/>}{playLabel}</button>}
              <button onClick={toggleBookmark} aria-pressed={bookmarked} className="btn-ghost !py-3.5"><Bookmark className="h-4 w-4" fill={bookmarked?"currentColor":"none"}/>{bookmarked?t("story.saved"):t("story.save")}</button>
              {story.storyId&&<VoiceToggle voice={n.voice} onChange={n.setVoice}/>}
            </div>
          </div>
        </div>

        {story.storyId&&<div className="card mt-8 p-5 min-[760px]:p-7">
          <Waveform seed={story.slug} progress={progress} onSeek={live?f=>p.seek(f*p.duration):undefined} label={t("story.play")}/>
          <div className="mt-2 flex justify-between text-xs font-bold tabular-nums text-mut2"><span>{formatTime(live?p.elapsed:0)}</span><span>-{formatTime(live?Math.max(0,p.duration-p.elapsed):minutes*60)}</span></div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <button onClick={p.cycleRate} disabled={!live} aria-label={t("story.speed")} className="h-11 min-w-[72px] rounded-full border border-line2 px-4 text-sm font-extrabold disabled:opacity-40">{(live?p.rate:1)}×</button>
            <div className="flex items-center gap-3">
              <button onClick={()=>p.skip(-15)} disabled={!live} aria-label={t("story.back15")} className="flex h-12 w-12 items-center justify-center rounded-full bg-chip disabled:opacity-40"><RotateCcw className="h-5 w-5"/></button>
              <button onClick={()=>void n.play()} disabled={n.busy} aria-label={playLabel} className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-ink text-bg shadow-card disabled:opacity-50">{n.playing?<Pause className="h-7 w-7 fill-current"/>:<Play className="ms-1 h-7 w-7 fill-current"/>}</button>
              <button onClick={()=>p.skip(15)} disabled={!live} aria-label={t("story.fwd15")} className="flex h-12 w-12 items-center justify-center rounded-full bg-chip disabled:opacity-40"><RotateCw className="h-5 w-5"/></button>
            </div>
            <button onClick={p.cycleSleep} disabled={!live} className={"inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-extrabold disabled:opacity-40 "+(live&&p.sleep?"border-teal bg-teal/15 text-teal":"border-line2")}><Moon className="h-4 w-4"/><span className="hidden min-[480px]:inline">{live&&p.sleep?t("story.sleepOn",{n:p.sleep}):t("story.sleep")}</span></button>
          </div>
          {(n.error||(live&&(p.error||p.preparing||p.resumeWaiting))||narrationLang!==lang)&&<div className="mt-4 space-y-1 text-sm text-mut">
            {n.error&&<p className="font-semibold text-coral">{n.error==="unavailable"?t("story.unavailable"):n.error}</p>}
            {live&&p.error&&<p className="font-semibold text-coral">{p.error}</p>}
            {live&&p.preparing&&<p>{t("story.preparing",{done:p.preparing.done,total:p.preparing.total||"…"})} {t("story.firstTime")}</p>}
            {live&&p.resumeWaiting&&<p>{t("story.resumeWaiting",{n:p.resumeWaiting})}</p>}
            {narrationLang!==lang&&<p>{t("story.narrationLang")}</p>}
          </div>}
        </div>}

        <div className={"mt-6 grid gap-6 "+((live&&p.segments.length>1)||story.source?"min-[900px]:grid-cols-[1fr_340px]":"")}>
          <article id="read" className="card scroll-mt-24 p-5 min-[760px]:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow text-mut2">{t("story.readAlong")}</p>
              {languages.length>1&&<div role="tablist" aria-label="Story language" className="flex rounded-full bg-chip p-1">{languages.map(l=><button key={l} role="tab" lang={l} aria-selected={lang===l} onClick={()=>setLang(l)} className={"rounded-full px-3.5 py-1.5 text-sm font-bold transition "+(lang===l?"bg-ink text-bg":"text-mut hover:text-ink")}>{LANG_NAMES[l]||l}</button>)}</div>}
            </div>
            <div lang={lang} dir={rtl?"rtl":"ltr"} className={"mt-5 space-y-1 "+(rtl?"font-sans text-[20px] leading-[2]":"font-display text-[21px] leading-[1.5]")}>
              {segmentsInLang?paragraphs.map((para,i)=><button key={i} onClick={()=>jumpTo(para)} className={"block w-full rounded-xl px-3 py-2 text-start transition "+(reading(para)?"bg-hl text-ink":"text-mut hover:text-ink")}>{para}</button>)
                :paragraphs.map((para,i)=><p key={i} className="px-3 py-2 text-ink/90">{para}</p>)}
            </div>
          </article>
          <aside className="space-y-4">
            {live&&p.segments.length>1&&<div className="card p-5">
              <p className="eyebrow text-mut2">{t("story.parts")}</p>
              <div className="mt-3 space-y-1">{p.segments.map((s,i)=><button key={s.id} onClick={()=>p.choose(i)} className={"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-bold transition "+(i===p.index?"bg-hl":"hover:bg-chip")}>
                <span className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs "+(i===p.index?"text-[#1A0E00]":"bg-chip text-mut")} style={i===p.index?{background:"linear-gradient(135deg,#FFB020,#FF5A5F)"}:undefined}>{i+1}</span>
                <span className="flex-1">{t("story.part",{n:i+1})}</span><span className="text-xs text-mut2">{formatTime((s.endMs-s.startMs)/1000)}</span>
              </button>)}</div>
            </div>}
            {story.source&&<div className="rounded-[24px] border border-teal/30 bg-teal/[0.08] p-5">
              <p className="eyebrow text-teal">{t("story.source")}</p>
              <p className="mt-2 font-extrabold">{story.source.name}</p>
              <p className="mt-1 text-sm text-mut">{story.source.license||story.source.rightsStatus}</p>
              {story.source.url&&<a href={story.source.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-teal">{t("story.openSource")} →</a>}
            </div>}
          </aside>
        </div>
      </section>
    </div>
    <SiteFooter/>
  </main>;
}
