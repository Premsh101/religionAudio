"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import ItemCard from "./ItemCard";
import { Rail } from "../StoryTile";
import { useT } from "../AppProvider";
import { getHistory } from "../../lib/client/history";
import { fallbackCover, photoUrl } from "../../lib/categories";
import type { FeedItem } from "../../lib/server/recommendations";

export type Feed={continueItems:FeedItem[];recommended:FeedItem[];becauseYou:{seed:FeedItem;items:FeedItem[]}|null;popular:FeedItem[];newArrivals:FeedItem[]};

/** Personal home rows, computed from the server's progress plus this browser's history. */
export function useHomeFeed(){
  const [feed,setFeed]=useState<Feed|null>(null);
  useEffect(()=>{
    const history=getHistory().map(({kind,id,progressPercent,completed,updatedAt,passageSequence})=>({kind,id,progressPercent,completed,updatedAt,passageSequence}));
    fetch("/api/home",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({history})})
      .then(r=>r.ok?r.json():null).then(setFeed).catch(()=>setFeed(null));
  },[]);
  return feed;
}

/** Continue listening: thumbnail, progress and a play button straight back to where they stopped. */
export function ContinueListening({items}:{items:FeedItem[]}){
  const t=useT();
  if(!items.length)return null;
  return <section className="container-site pb-12">
    <div className="mb-4 flex items-end justify-between gap-4"><h2 className="h-rail">{t("home.continue")}</h2><Link href="/history" className="text-sm font-extrabold text-acc">{t("home.history")}</Link></div>
    <div className="grid gap-3" style={{gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,300px),1fr))"}}>
      {items.slice(0,6).map(i=>{
        const img=i.coverUrl||(i.kind==="work"?photoUrl("book-open"):fallbackCover(i.category||"stories",i.slug));
        return <Link key={i.kind+i.id} href={i.href} className="lift-sm flex items-center gap-3.5 rounded-[22px] border border-line bg-card p-3">
          <img src={img} alt="" className="h-[72px] w-[72px] shrink-0 rounded-2xl object-cover"/>
          <div className="min-w-0 flex-1">
            <p dir="auto" className="truncate text-[15px] font-extrabold">{i.title}</p>
            <p className="mt-0.5 text-xs font-semibold text-mut2">{Math.round(i.progressPercent||0)}%</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line2"><div className="h-full rounded-full" style={{width:`${Math.max(4,i.progressPercent||0)}%`,background:"linear-gradient(90deg,#FFB020,#FF5A5F)"}}/></div>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-bg"><Play className="ms-0.5 h-4 w-4 fill-current"/></span>
        </Link>;
      })}
    </div>
  </section>;
}

/** Recommendation rails: "because you listened to" and "picked for you". */
export default function PersonalShelves({feed}:{feed:Feed|null}){
  const t=useT();
  if(!feed)return null;
  return <>
    {feed.becauseYou&&<Rail title={t("home.because",{title:feed.becauseYou.seed.title})}>{feed.becauseYou.items.map(i=><ItemCard key={i.kind+i.id} item={i}/>)}</Rail>}
    {feed.recommended.length>0&&<Rail title={t("home.recommended")}>{feed.recommended.map(i=><ItemCard key={i.kind+i.id} item={i}/>)}</Rail>}
  </>;
}
