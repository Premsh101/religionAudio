"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useT } from "../AppProvider";
import { CATEGORY_STYLE, categoryBlurbKey, categoryGradient, categoryLabelKey } from "../../lib/categories";
import type { CategoryPick } from "../../lib/server/catalog";

const INTERVAL=3500;

/**
 * Hero strip that glides one card at a time, one card per category, looping forever.
 * Pauses on hover, focus or touch, and stays still for people who prefer reduced motion.
 */
export default function CategoryCarousel({picks}:{picks:CategoryPick[]}){
  const t=useT();
  const n=picks.length;
  const loop=n>1?[...picks,...picks.slice(0,Math.min(n,5))]:picks;
  const [index,setIndex]=useState(0);
  const [animate,setAnimate]=useState(true);
  const [hovered,setHovered]=useState(false);
  const [stopped,setStopped]=useState(false);
  const [step,setStep]=useState(0);
  const trackRef=useRef<HTMLDivElement>(null);

  useLayoutEffect(()=>{
    const measure=()=>{
      const first=trackRef.current?.children[0] as HTMLElement|undefined;
      const second=trackRef.current?.children[1] as HTMLElement|undefined;
      if(first)setStep(second?second.offsetLeft-first.offsetLeft:first.offsetWidth);
    };
    measure();
    window.addEventListener("resize",measure);
    return()=>window.removeEventListener("resize",measure);
  },[n]);

  useEffect(()=>{
    if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)setStopped(true);
  },[]);

  const indexRef=useRef(0);
  useEffect(()=>{indexRef.current=index},[index]);
  const go=useCallback((delta:number)=>{
    const i=indexRef.current;
    if(delta<0&&i===0){
      // Jump to the duplicate copy without animating, then slide back one.
      setAnimate(false);setIndex(n);
      requestAnimationFrame(()=>requestAnimationFrame(()=>{setAnimate(true);setIndex(n-1)}));
      return;
    }
    setAnimate(true);
    setIndex(Math.min(i+delta,loop.length-1));
  },[n,loop.length]);

  useEffect(()=>{
    if(n<2||hovered||stopped)return;
    const timer=setInterval(()=>go(1),INTERVAL);
    return()=>clearInterval(timer);
  },[n,hovered,stopped,go]);

  function onTransitionEnd(){
    if(index>=n){
      setAnimate(false);
      setIndex(index-n);
      requestAnimationFrame(()=>requestAnimationFrame(()=>setAnimate(true)));
    }
  }

  if(!n)return null;
  const current=index%n;

  return <div className="relative" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setHovered(true)} onBlurCapture={()=>setHovered(false)} onTouchStart={()=>setHovered(true)} onTouchEnd={()=>setTimeout(()=>setHovered(false),4000)}>
    <div className="overflow-hidden" dir="ltr">
      <div ref={trackRef} onTransitionEnd={onTransitionEnd} className="flex gap-4" style={{transform:`translateX(${-index*step}px)`,transition:animate?"transform 700ms cubic-bezier(.22,.8,.24,1)":"none"}}>
        {loop.map((pick,i)=>{
          const story=pick.story;
          const href=story?"/stories/"+story.slug:"/stories?c="+pick.category;
          const active=i%n===current;
          return <Link key={pick.category+"-"+i} href={href} tabIndex={i<n?0:-1} aria-hidden={i>=n} className={"group relative block aspect-[4/5] w-[78%] shrink-0 overflow-hidden rounded-3xl ring-1 ring-white/10 transition duration-500 sm:w-[46%] lg:w-[31%] xl:w-[23.5%] "+(active?"":"opacity-90")} style={story?.coverUrl?undefined:{background:categoryGradient(pick.category)}}>
            {story?.coverUrl?<img src={story.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"/>:<>
              <span aria-hidden className="absolute -end-6 -top-4 select-none text-[11rem] leading-none opacity-25">{CATEGORY_STYLE[pick.category].emoji}</span>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,.28),transparent_55%)]"/>
            </>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10"/>
            <div className="absolute inset-x-0 top-0 p-4" dir="auto">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{CATEGORY_STYLE[pick.category].emoji} {t(categoryLabelKey(pick.category))}</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5" dir="auto">
              <h3 className="font-display text-2xl font-semibold leading-tight text-white" style={{textWrap:"balance"} as React.CSSProperties}>{story?.title||t(categoryLabelKey(pick.category))}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">{story?.summary||t(categoryBlurbKey(pick.category))}</p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition group-hover:bg-amber-200"><Play className="h-4 w-4 fill-current"/>{story?t("home.listen"):t("home.explore")}</span>
            </div>
          </Link>;
        })}
      </div>
    </div>
    {n>1&&<div className="mt-5 flex items-center justify-between gap-4">
      <div className="scrollbar-hide flex min-w-0 gap-1.5 overflow-x-auto" dir="ltr">{picks.map((p,i)=><button key={p.category} onClick={()=>{setAnimate(true);setIndex(i)}} aria-label={t(categoryLabelKey(p.category))} aria-current={i===current} className={"h-1.5 shrink-0 rounded-full transition-all "+(i===current?"w-6 bg-amber-300":"w-1.5 bg-white/25 hover:bg-white/50")}/>)}</div>
      <div className="flex shrink-0 gap-2" dir="ltr">
        <button onClick={()=>setStopped(s=>!s)} aria-label={stopped?t("home.play"):t("home.pause")} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-300 hover:bg-white/10">{stopped?<Play className="h-4 w-4"/>:<Pause className="h-4 w-4"/>}</button>
        <button onClick={()=>go(-1)} aria-label={t("home.previous")} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-300 hover:bg-white/10"><ChevronLeft className="h-4 w-4"/></button>
        <button onClick={()=>go(1)} aria-label={t("home.next")} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-300 hover:bg-white/10"><ChevronRight className="h-4 w-4"/></button>
      </div>
    </div>}
  </div>;
}
