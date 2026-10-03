"use client";

import Link from "next/link";
import { BookOpen, Ghost, Headphones, Sparkles, Baby, Search, ScrollText } from "lucide-react";
import type { FeedItem } from "../../lib/server/recommendations";
import CoverArt from "../CoverArt";
import { useT } from "../AppProvider";

const accents:Record<string,string>={
  "Ghost story":"from-violet-500/35 via-fuchsia-500/10",
  Mythology:"from-amber-500/35 via-orange-500/10",
  Folklore:"from-emerald-500/30 via-teal-500/10",
  "Moral tale":"from-rose-500/30 via-pink-500/10",
  Story:"from-sky-500/30 via-cyan-500/10",
};
export function accentFor(item:Pick<FeedItem,"kind"|"tag">){return accents[item.tag]||(item.kind==="work"?"from-indigo-500/35 via-blue-500/10":"from-sky-500/30 via-cyan-500/10")}

export function iconFor(item:Pick<FeedItem,"kind"|"tag">,className="h-4 w-4"){
  if(item.kind==="work")return <ScrollText className={className}/>;
  if(item.tag==="Ghost story")return <Ghost className={className}/>;
  if(item.tag==="Mythology")return <Sparkles className={className}/>;
  if(item.tag==="Moral tale")return <Baby className={className}/>;
  if(item.tag==="Mystery")return <Search className={className}/>;
  if(item.tag==="Folklore")return <Headphones className={className}/>;
  return <BookOpen className={className}/>;
}

export default function ItemCard({item,showProgress}:{item:FeedItem;showProgress?:boolean}){
  const t=useT();
  return <Link href={item.href} className="group flex w-[42vw] max-w-[11rem] shrink-0 snap-start flex-col sm:w-44">
    <div className="relative transition group-hover:-translate-y-1">
      <CoverArt title={item.title} tag={item.tag} kind={item.kind} coverUrl={item.coverUrl} size="sm"/>
      {item.isNew&&<span className="absolute right-2 top-2 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">{t("common.new")}</span>}
    </div>
    <p className="mt-3 line-clamp-2 text-sm font-medium leading-snug text-white">{item.title}</p>
    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">{iconFor(item,"h-3 w-3")}{item.tag}</p>
    {showProgress&&typeof item.progressPercent==="number"?<div className="mt-2">
      <div className="h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-300" style={{width:Math.max(4,item.progressPercent)+"%"}}/></div>
      <p className="mt-1 text-[11px] text-zinc-500">{item.progressPercent}% · {t("common.resume")}</p>
    </div>:item.reason?<p className="mt-1 text-[11px] text-zinc-600">{item.reason}</p>:null}
  </Link>;
}
