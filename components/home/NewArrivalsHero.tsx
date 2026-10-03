"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Headphones, Search, Sparkles } from "lucide-react";
import type { FeedItem } from "../../lib/server/recommendations";
import { accentFor, iconFor } from "./ItemCard";

/** Featured carousel of the newest books and stories, like the hero on streaming and audiobook apps. */
export default function NewArrivalsHero({items}:{items:FeedItem[]}){
  const [active,setActive]=useState(0);
  const [paused,setPaused]=useState(false);
  useEffect(()=>{
    if(paused||items.length<2)return;
    const reduce=typeof window!=="undefined"&&window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if(reduce)return;
    const t=setInterval(()=>setActive(i=>(i+1)%items.length),7000);
    return()=>clearInterval(t);
  },[paused,items.length]);
  const item=items[active];

  return <section className="mx-auto max-w-7xl px-5 pb-12 pt-5 md:px-8 md:pt-7" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)}>
    <div className={`relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br ${accentFor(item)} to-zinc-950 p-7 transition-colors duration-700 md:p-12`}>
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl"/>
      <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0 max-w-3xl" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 font-semibold text-black"><Sparkles className="h-3.5 w-3.5"/>{item.isNew?"Newly added":"Featured"}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-zinc-300">{iconFor(item,"h-3.5 w-3.5")}{item.tag}</span>
            <span className="text-zinc-500">{item.kind==="work"?"Book":"Story"}</span>
          </div>
          <h1 className="mt-6 font-display text-4xl leading-[1.08] tracking-tight md:text-6xl">{item.title}</h1>
          {item.subtitle&&<p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">{item.subtitle}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={item.href} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black"><Headphones className="h-4 w-4"/>{item.kind==="work"?"Read & listen":"Listen now"}</Link>
            <Link href={item.kind==="work"?"/library":"/stories"} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3.5 text-sm text-zinc-200">Browse {item.kind==="work"?"library":"stories"}<ArrowRight className="h-4 w-4"/></Link>
          </div>
        </div>
        {items.length>1&&<div className="scrollbar-hide flex min-w-0 gap-2 overflow-x-auto md:flex-col md:overflow-visible" role="tablist" aria-label="New arrivals">
          {items.map((it,i)=><button key={it.kind+it.id} role="tab" aria-selected={i===active} aria-label={it.title} onClick={()=>setActive(i)} className={"max-w-[11rem] shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition md:w-56 md:max-w-none "+(i===active?"border-white/30 bg-white/10 text-white":"border-white/10 bg-black/20 text-zinc-500 hover:text-zinc-300")}><span className="line-clamp-1">{it.title}</span></button>)}
        </div>}
      </div>
      <form action="/search" className="relative mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2"><Search className="ml-3 h-5 w-5 text-zinc-600"/><input name="q" aria-label="Search" placeholder="Search Krishna, Buddha, ghost stories, Sarnath..." className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-zinc-700"/><button className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black">Search</button></form>
    </div>
  </section>;
}
