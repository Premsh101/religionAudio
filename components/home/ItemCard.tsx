import Link from "next/link";
import { BookOpen, Ghost, Headphones, Sparkles, Baby, Search, ScrollText } from "lucide-react";
import type { FeedItem } from "../../lib/server/recommendations";

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
  return <Link href={item.href} className={`group relative flex w-60 shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${accentFor(item)} to-zinc-950 p-5 transition hover:-translate-y-1 hover:border-white/20 md:w-64`}>
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-zinc-400">{iconFor(item)}{item.tag}</span>
      {item.isNew&&<span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">New</span>}
    </div>
    <h3 className="mt-8 line-clamp-2 font-display text-xl leading-snug text-white">{item.title}</h3>
    {item.subtitle&&<p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{item.subtitle}</p>}
    {showProgress&&typeof item.progressPercent==="number"?<div className="mt-auto pt-5">
      <div className="h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-300" style={{width:Math.max(4,item.progressPercent)+"%"}}/></div>
      <p className="mt-2 text-[11px] text-zinc-500">{item.progressPercent}% · Resume</p>
    </div>:item.reason?<p className="mt-auto pt-5 text-[11px] text-zinc-600">{item.reason}</p>:null}
  </Link>;
}
