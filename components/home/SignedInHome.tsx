"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenText, Play } from "lucide-react";
import AppHeader from "../AppHeader";
import SiteFooter from "../SiteFooter";
import PersonalShelves, { ContinueListening, useHomeFeed } from "./PersonalShelves";
import StoryTile, { Rail } from "../StoryTile";
import { useApp } from "../AppProvider";
import { CATEGORY_STYLE, categoryBlurbKey, categoryLabelKey, categoryPhoto, fallbackCover, type CategoryKey } from "../../lib/categories";
import type { CategoryPick, StoryCard } from "../../lib/server/catalog";

/** Featured banner: one story per category, rotating every 6 s (still for reduced-motion users). */
function FeaturedBanner({picks}:{picks:CategoryPick[]}){
  const {t}=useApp();
  const [i,setI]=useState(0);
  const [paused,setPaused]=useState(false);
  useEffect(()=>{
    if(paused||picks.length<2||window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
    const timer=setInterval(()=>setI(n=>(n+1)%picks.length),6000);
    return()=>clearInterval(timer);
  },[paused,picks.length]);
  if(!picks.length)return null;
  const pick=picks[i%picks.length];
  const s=pick.story;
  const color=CATEGORY_STYLE[pick.category].color;
  const img=s?.coverUrl||(s?fallbackCover(pick.category,s.slug):categoryPhoto(pick.category));
  const href=s?"/stories/"+s.slug:"/stories?c="+pick.category;
  return <div className="relative flex min-h-[420px] items-end overflow-hidden rounded-[28px] min-[760px]:min-h-[460px] min-[760px]:rounded-[34px]" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)}>
    {picks.map((p,k)=><img key={p.category} src={p.story?.coverUrl||(p.story?fallbackCover(p.category,p.story.slug):categoryPhoto(p.category))} alt="" className={"absolute inset-0 h-full w-full object-cover transition-opacity duration-700 "+(k===i%picks.length?"opacity-100":"opacity-0")} loading={k===0?"eager":"lazy"}/>)}
    <div className="absolute inset-0" style={{background:`linear-gradient(165deg, ${color}55 0%, rgba(0,0,0,0) 45%)`}}/>
    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(9,7,20,.95)] via-[rgba(9,7,20,.45)] to-[rgba(9,7,20,.05)] min-[760px]:bg-gradient-to-r rtl:min-[760px]:bg-gradient-to-l"/>
    <div className="relative max-w-2xl p-6 min-[760px]:p-10" aria-live="polite">
      <span className="rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.08em] text-white" style={{background:color}}>{t(categoryLabelKey(pick.category))}</span>
      <h2 dir="auto" className="mt-4 font-display text-[40px] leading-[1] tracking-[-.02em] text-white min-[760px]:text-[60px]" style={{textWrap:"balance"} as React.CSSProperties}>{s?.title||t(categoryLabelKey(pick.category))}</h2>
      <p className="mt-3 line-clamp-3 max-w-xl text-[15px] leading-relaxed text-white/80 min-[760px]:text-base">{s?.summary||t(categoryBlurbKey(pick.category))}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={s?href+"?play=1":href} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-extrabold text-[#120F24]"><Play className="h-4 w-4 fill-current"/>{s?<>{t("home.listen")}{s.minutes?<span className="font-bold"> · {s.minutes} min</span>:null}</>:t("home.explore")}</Link>
        {s&&<Link href={href+"#read"} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3.5 text-[15px] font-bold text-white backdrop-blur-md"><BookOpenText className="h-4 w-4"/>{t("home.readAlong")}</Link>}
      </div>
    </div>
    {picks.length>1&&<div className="absolute bottom-6 end-6 hidden gap-1.5 min-[480px]:flex" dir="ltr">{picks.map((p,k)=><button key={p.category} onClick={()=>setI(k)} aria-label={t(categoryLabelKey(p.category))} aria-current={k===i%picks.length} className={"h-2 rounded-full transition-all "+(k===i%picks.length?"w-6 bg-white":"w-2 bg-white/45 hover:bg-white/70")}/>)}</div>}
  </div>;
}

function useGreeting(){
  const {t,user}=useApp();
  const [greet,setGreet]=useState<string|null>(null);
  useEffect(()=>{const h=new Date().getHours();setGreet(t(h<12?"home.morning":h<17?"home.afternoon":"home.evening"))},[t]);
  const name=user?.displayName?.split(" ")[0];
  if(!greet)return name?t("home.welcome",{name}):t("home.welcomeAnon");
  return name?t("home.greetName",{greet,name}):greet;
}

/** Top 10 with big outlined numbers in each story's category colour. */
function TopTen({stories}:{stories:StoryCard[]}){
  const {t}=useApp();
  if(stories.length<3)return null;
  return <section className="container-site pb-12">
    <h2 className="h-rail mb-4">{t("home.top10")}</h2>
    <div className="scrollbar-hide -mx-[18px] flex snap-x gap-2 overflow-x-auto px-[18px] pb-2 min-[760px]:-mx-10 min-[760px]:px-10">
      {stories.slice(0,10).map((s,k)=><Link key={s.id} href={"/stories/"+s.slug} className="group flex shrink-0 snap-start items-end" dir="ltr">
        <span aria-hidden className="-me-5 font-display text-[150px] leading-[.8] text-transparent" style={{WebkitTextStroke:`2px ${CATEGORY_STYLE[s.category].color}`}}>{k+1}</span>
        <div className="lift-sm relative w-[150px] min-[760px]:w-[170px]"><StoryCoverLite story={s}/></div>
      </Link>)}
    </div>
  </section>;
}

function StoryCoverLite({story}:{story:StoryCard}){
  return <div className="relative aspect-[3/4] overflow-hidden rounded-[18px]" style={{background:CATEGORY_STYLE[story.category].color}}>
    <img src={story.coverUrl||fallbackCover(story.category,story.slug)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover"/>
    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(9,7,20,.94)] via-[rgba(9,7,20,.35)] to-transparent"/>
    <div className="absolute inset-x-0 bottom-0 p-3"><p dir="auto" className="font-display text-[19px] leading-[1.02] text-white">{story.title}</p>{story.minutes?<p className="mt-1 text-xs font-semibold text-white/75">{story.minutes} min</p>:null}</div>
  </div>;
}

/** Home for signed-in listeners. */
export default function SignedInHome({picks,groups,newest,top}:{picks:CategoryPick[];groups:{category:CategoryKey;stories:StoryCard[]}[];newest:StoryCard[];top:StoryCard[]}){
  const {t}=useApp();
  const greeting=useGreeting();
  const feed=useHomeFeed();
  return <main className="min-h-screen">
    <AppHeader/>
    <section className="container-site pb-6 pt-6 min-[760px]:pt-9">
      <p className="text-sm font-extrabold text-acc">{greeting}</p>
      <h1 className="h-page mb-5 mt-1">{t("home.heroTitle")}</h1>
      {picks.length?<FeaturedBanner picks={picks}/>:<div className="card p-10 text-center text-mut">{t("home.empty")}</div>}
    </section>

    {groups.length>0&&<section className="container-site pb-10">
      <div className="scrollbar-hide -mx-[18px] flex gap-2.5 overflow-x-auto px-[18px] pb-1 min-[760px]:-mx-10 min-[760px]:px-10">
        {groups.map(g=><Link key={g.category} href={"/stories?c="+g.category} className="flex shrink-0 items-center gap-2.5 rounded-full border border-line bg-card py-1.5 pe-5 ps-1.5 text-sm font-bold transition hover:border-line2">
          <img src={categoryPhoto(g.category)} alt="" className="h-9 w-9 rounded-full object-cover"/>{t(categoryLabelKey(g.category))}
        </Link>)}
      </div>
    </section>}

    <ContinueListening items={feed?.continueItems||[]}/>
    <TopTen stories={top}/>
    {newest.length>0&&<Rail title={t("home.new")} href="/stories" action={t("home.seeAll")}>{newest.map(s=><StoryTile key={s.id} story={s}/>)}</Rail>}
    <PersonalShelves feed={feed}/>
    {groups.map(g=><Rail key={g.category} title={t(categoryLabelKey(g.category))} href={"/stories?c="+g.category} action={t("home.seeAll")}>{g.stories.slice(0,12).map(s=><StoryTile key={s.id} story={s} showTag={false}/>)}</Rail>)}
    <SiteFooter/>
  </main>;
}
