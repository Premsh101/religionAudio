"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Play } from "lucide-react";
import { useT } from "./AppProvider";
import { CATEGORY_STYLE, categoryGradient, categoryLabelKey, type CategoryKey } from "../lib/categories";
import type { StoryCard } from "../lib/server/catalog";

/** Cover for a story: its artwork, or a coloured card for its category with the title set over it. */
export function StoryCover({title,category,coverUrl,large}:{title:string;category:CategoryKey;coverUrl:string|null;large?:boolean}){
  return <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-lg shadow-black/30 ring-1 ring-white/10" style={coverUrl?undefined:{background:categoryGradient(category)}}>
    {coverUrl?<img src={coverUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover"/>:<>
      <span aria-hidden className="absolute -bottom-4 -end-3 select-none text-[7rem] leading-none opacity-30 blur-[1px]">{CATEGORY_STYLE[category].emoji}</span>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.25),transparent_55%)]"/>
    </>}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30"/>
    <p dir="auto" className={"absolute inset-x-0 bottom-0 p-3 font-display font-semibold leading-tight text-white drop-shadow "+(large?"text-xl":"text-[15px]")} style={{textWrap:"balance"} as React.CSSProperties}>{title}</p>
  </div>;
}

export default function StoryTile({story,wide}:{story:StoryCard;wide?:boolean}){
  const t=useT();
  return <Link href={"/stories/"+story.slug} className={"group block shrink-0 snap-start "+(wide?"w-full":"w-[42vw] max-w-[11rem] sm:w-44")}>
    <div className="relative transition duration-300 group-hover:-translate-y-1">
      <StoryCover title={story.title} category={story.category} coverUrl={story.coverUrl}/>
      {story.isNew&&<span className="absolute start-2 top-2 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">{t("common.new")}</span>}
      <span className="absolute bottom-3 end-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"><Play className="h-4 w-4 fill-current"/></span>
    </div>
    <p className="mt-2 text-xs text-zinc-500">{CATEGORY_STYLE[story.category].emoji} {t(categoryLabelKey(story.category))}{story.ageMin?` · ${t("stories.ages",{age:story.ageMin})}`:""}</p>
  </Link>;
}

export function Shelf({title,href,action,children}:{title:React.ReactNode;href?:string;action?:string;children:React.ReactNode}){
  return <section className="mx-auto max-w-7xl px-4 pb-10 md:px-8">
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="font-display text-xl font-semibold md:text-2xl">{title}</h2>
      {href&&<Link href={href} className="shrink-0 text-sm font-medium text-amber-300 hover:text-amber-200">{action}</Link>}
    </div>
    <div className="scrollbar-hide -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:scroll-px-8 md:px-8">{children}</div>
  </section>;
}
