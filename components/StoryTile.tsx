"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useT } from "./AppProvider";
import { CATEGORY_STYLE, categoryLabelKey, fallbackCover, type CategoryKey } from "../lib/categories";
import type { StoryCard } from "../lib/server/catalog";

const TITLE_SIZE={sm:"text-[19px]",md:"text-[24px]",lg:"text-[34px]"};

/** Photo cover from the Sunave design: tint in the category colour, dark fade, serif title, optional tag/NEW/progress. */
export function Cover({title,category,coverUrl,seed,size="sm",sub,tag,isNew,progress,className="",ratio="3/4"}:{title:string;category:CategoryKey;coverUrl?:string|null;seed?:string;size?:"sm"|"md"|"lg";sub?:string;tag?:string;isNew?:boolean;progress?:number;className?:string;ratio?:string}){
  const t=useT();
  const color=CATEGORY_STYLE[category].color;
  const img=coverUrl||fallbackCover(category,seed||title);
  return <div className={"relative isolate w-full overflow-hidden "+(size==="lg"?"rounded-[24px]":"rounded-[18px]")+" "+className} style={{aspectRatio:ratio,background:color,boxShadow:"0 18px 40px -20px rgba(10,8,25,.6)"}}>
    <img src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover"/>
    <div className="absolute inset-0" style={{background:`linear-gradient(165deg, ${color}99 0%, rgba(0,0,0,0) 48%)`}}/>
    <div className="absolute inset-0" style={{background:"linear-gradient(to top, rgba(9,7,20,.94) 0%, rgba(9,7,20,.55) 36%, rgba(9,7,20,0) 66%)"}}/>
    {tag!==undefined&&<span className="absolute start-2.5 top-2.5 flex max-w-[75%] items-center gap-1.5 rounded-full bg-[rgba(9,7,20,.55)] py-[5px] pe-2.5 ps-2 text-[11px] font-bold leading-none text-white backdrop-blur-md"><span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{background:color}}/><span className="truncate">{tag||t(categoryLabelKey(category))}</span></span>}
    {isNew&&<span className="absolute end-2.5 top-2.5 rounded-full px-[9px] py-[5px] text-[10px] font-extrabold uppercase leading-none tracking-[.08em] text-[#1A0E00]" style={{background:"linear-gradient(135deg,#FFB020,#FF5A5F)"}}>{t("common.new")}</span>}
    <div className={"absolute inset-x-0 bottom-0 flex flex-col gap-1.5 "+(size==="lg"?"p-5":"p-3.5")}>
      <div dir="auto" className={"font-display leading-[1.02] text-white "+TITLE_SIZE[size]} style={{textWrap:"balance",textShadow:"0 2px 12px rgba(0,0,0,.4)"} as React.CSSProperties}>{title}</div>
      {sub&&<div className="text-xs font-semibold leading-tight text-white/80">{sub}</div>}
      {typeof progress==="number"&&<div className="mt-1 h-1 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full" style={{width:`${Math.max(4,progress)}%`,background:"linear-gradient(90deg,#FFB020,#FF5A5F)"}}/></div>}
    </div>
  </div>;
}

export function storyMeta(t:ReturnType<typeof useT>,story:Pick<StoryCard,"ageMin"|"minutes">){
  return [story.ageMin?t("stories.ages",{age:story.ageMin}):"",story.minutes?`${story.minutes} min`:""].filter(Boolean).join(" · ");
}

/** A story in a rail or grid: cover with category tag, then age and length underneath. */
export default function StoryTile({story,wide,showTag=true}:{story:StoryCard;wide?:boolean;showTag?:boolean}){
  const t=useT();
  return <Link href={"/stories/"+story.slug} className={"group block shrink-0 snap-start "+(wide?"w-full":"w-[46vw] max-w-[184px] min-[480px]:w-[184px]")}>
    <div className="lift-sm"><Cover title={story.title} category={story.category} coverUrl={story.coverUrl} seed={story.slug} tag={showTag?"":undefined} isNew={story.isNew}/></div>
    <div className="mt-2.5 flex items-center justify-between gap-2 text-xs font-semibold text-mut"><span className="truncate">{story.ageMin?t("stories.ages",{age:story.ageMin}):t(categoryLabelKey(story.category))}</span>{story.minutes?<span className="shrink-0 tabular-nums">{story.minutes} min</span>:null}</div>
  </Link>;
}

export function Rail({title,href,action,children,big}:{title:React.ReactNode;href?:string;action?:string;children:React.ReactNode;big?:boolean}){
  return <section className="container-site pb-12">
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className={big?"h-section":"h-rail"}>{title}</h2>
      {href&&<Link href={href} className="shrink-0 text-sm font-extrabold text-acc">{action} →</Link>}
    </div>
    <div className="scrollbar-hide -mx-[18px] flex snap-x scroll-px-[18px] gap-4 overflow-x-auto px-[18px] pb-2 min-[760px]:-mx-10 min-[760px]:scroll-px-10 min-[760px]:px-10">{children}</div>
  </section>;
}
/** Kept for older imports. */
export const Shelf=Rail;
