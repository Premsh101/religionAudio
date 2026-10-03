"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { formatTime, usePlayer } from "./PlayerProvider";

/** Sticky bottom player that follows the listener around the site (sits above the phone tab bar). */
export default function MiniPlayer(){
  const p=usePlayer();
  const path=usePathname();
  if(!p.item||path===p.item.href)return null;
  const progress=p.duration?Math.min(1,p.elapsed/p.duration):0;
  return <div className="fixed inset-x-0 bottom-[78px] z-40 px-3 min-[760px]:bottom-4">
    <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[22px] border border-line2 bg-card shadow-card backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-line"><div className="h-full" style={{width:`${progress*100}%`,background:"linear-gradient(90deg,#FFB020,#FF5A5F)"}}/></div>
      <div className="flex items-center gap-3 p-2.5 pe-3">
        <Link href={p.item.href} className="flex min-w-0 flex-1 items-center gap-3">
          {p.item.coverUrl?<img src={p.item.coverUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover"/>:<span className="h-12 w-12 shrink-0 rounded-xl" style={{background:"linear-gradient(135deg,#FFB020,#FF5A5F)"}}/>}
          <span className="min-w-0"><span className="block truncate text-sm font-extrabold text-ink" dir="auto">{p.item.title}</span><span className="block text-xs font-semibold tabular-nums text-mut">{p.loading?"…":`${formatTime(p.elapsed)} / ${formatTime(p.duration)}`}</span></span>
        </Link>
        <button onClick={()=>p.skip(-15)} aria-label="Back 15 seconds" className="hidden h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-chip min-[760px]:flex"><RotateCcw className="h-5 w-5"/></button>
        <button onClick={p.toggle} disabled={p.loading||!p.segments.length} aria-label={p.playing?"Pause":"Play"} className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-bg disabled:opacity-40">{p.playing?<Pause className="h-5 w-5 fill-current"/>:<Play className="ms-0.5 h-5 w-5 fill-current"/>}</button>
        <button onClick={p.close} aria-label="Close player" className="flex h-10 w-10 items-center justify-center rounded-full text-mut hover:bg-chip hover:text-ink"><X className="h-5 w-5"/></button>
      </div>
    </div>
  </div>;
}
