"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ItemCard from "./ItemCard";
import { getHistory } from "../../lib/client/history";
import type { FeedItem } from "../../lib/server/recommendations";

type Feed={continueItems:FeedItem[];recommended:FeedItem[];becauseYou:{seed:FeedItem;items:FeedItem[]}|null;popular:FeedItem[];newArrivals:FeedItem[]};

function Shelf({eyebrow,title,action,children}:{eyebrow:string;title:ReactNode;action?:ReactNode;children:ReactNode}){
  return <section className="mx-auto max-w-7xl px-5 pb-10 md:px-8">
    <div className="mb-4 flex items-end justify-between gap-4"><div className="min-w-0"><p className="text-sm text-amber-300">{eyebrow}</p><h2 className="mt-1 font-display text-2xl md:text-3xl">{title}</h2></div>{action}</div>
    <div className="scrollbar-hide -mx-5 flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:-mx-8 md:scroll-px-8 md:px-8">{children}</div>
  </section>;
}

/** Continue listening, recommendations, "because you listened to", popular and new: personalised per listener. */
export default function PersonalShelves(){
  const [feed,setFeed]=useState<Feed|null>(null);
  useEffect(()=>{
    const history=getHistory().map(({kind,id,progressPercent,completed,updatedAt})=>({kind,id,progressPercent,completed,updatedAt}));
    fetch("/api/home",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({history})})
      .then(r=>r.ok?r.json():null).then(setFeed).catch(()=>setFeed(null));
  },[]);
  if(!feed)return null;
  const historyLink=<Link href="/history" className="hidden shrink-0 items-center gap-1 text-sm text-zinc-500 hover:text-white sm:flex">History <ArrowRight className="h-4 w-4"/></Link>;
  return <>
    {feed.continueItems.length>0&&<Shelf eyebrow="Pick up where you left off" title="Continue listening" action={historyLink}>{feed.continueItems.map(i=><ItemCard key={i.kind+i.id} item={i} showProgress/>)}</Shelf>}
    {feed.becauseYou&&<Shelf eyebrow="More like this" title={<>Because you listened to <span className="text-zinc-400">{feed.becauseYou.seed.title}</span></>}>{feed.becauseYou.items.map(i=><ItemCard key={i.kind+i.id} item={i}/>)}</Shelf>}
    {feed.recommended.length>0&&<Shelf eyebrow={feed.continueItems.length?"Picked for you":"Start here"} title="Recommended for you">{feed.recommended.map(i=><ItemCard key={i.kind+i.id} item={i}/>)}</Shelf>}
    {feed.popular.length>0&&<Shelf eyebrow="This month" title="Popular now">{feed.popular.map(i=><ItemCard key={i.kind+i.id} item={i}/>)}</Shelf>}
    {feed.newArrivals.length>0&&<Shelf eyebrow="Fresh on the shelf" title="New arrivals" action={<Link href="/library" className="hidden shrink-0 items-center gap-1 text-sm text-zinc-500 hover:text-white sm:flex">Library <ArrowRight className="h-4 w-4"/></Link>}>{feed.newArrivals.map(i=><ItemCard key={i.kind+i.id} item={i}/>)}</Shelf>}
  </>;
}
