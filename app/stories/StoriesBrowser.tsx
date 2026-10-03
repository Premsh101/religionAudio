"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import StoryTile, { Rail } from "../../components/StoryTile";
import { useT } from "../../components/AppProvider";
import { CATEGORY_STYLE, categoryBlurbKey, categoryLabelKey, categoryPhoto, type CategoryKey } from "../../lib/categories";
import type { StoryCard } from "../../lib/server/catalog";

export default function StoriesBrowser({groups,active}:{groups:{category:CategoryKey;stories:StoryCard[]}[];active:CategoryKey|null}){
  const t=useT();
  const current=active?groups.find(g=>g.category===active):null;
  return <main className="min-h-screen">
    <AppHeader/>
    <section className="container-site pb-6 pt-8 min-[760px]:pt-10">
      <h1 className="h-page">{t("stories.title")}</h1>
      <p className="mt-2 text-[17px] text-mut">{t("stories.sub")}</p>
      <nav className="mt-6 flex flex-wrap gap-2">
        <Link href="/stories" scroll={false} className={"rounded-full border px-4 py-2.5 text-sm font-bold transition "+(!active?"border-transparent bg-ink text-bg":"border-line bg-card text-ink hover:border-line2")}>{t("stories.all")}</Link>
        {groups.map(g=>{
          const on=active===g.category;
          return <Link key={g.category} href={"/stories?c="+g.category} scroll={false} className={"rounded-full border px-4 py-2.5 text-sm font-bold transition "+(on?"border-transparent text-white":"border-line bg-card text-ink hover:border-line2")} style={on?{background:CATEGORY_STYLE[g.category].color}:undefined}>{t(categoryLabelKey(g.category))}</Link>;
        })}
      </nav>
    </section>

    {active?<section className="container-site pb-10">
      <div className="relative mb-6 flex min-h-[200px] items-center overflow-hidden rounded-[28px] min-[760px]:min-h-[220px]" style={{background:CATEGORY_STYLE[active].color}}>
        <img src={categoryPhoto(active)} alt="" className="absolute inset-0 h-full w-full object-cover"/>
        <div className="absolute inset-0" style={{background:`linear-gradient(90deg, ${CATEGORY_STYLE[active].color} 15%, ${CATEGORY_STYLE[active].color}cc 40%, ${CATEGORY_STYLE[active].color}00 85%)`}}/>
        <div className="relative p-7 min-[760px]:p-10">
          <p className="eyebrow text-white/85">{t("landing.titlesCount",{n:current?.stories.length||0})}</p>
          <h2 className="mt-2 font-display text-[40px] leading-none text-white min-[760px]:text-[56px]">{t(categoryLabelKey(active))}</h2>
          <p className="mt-2 font-medium text-white/85">{t(categoryBlurbKey(active))}</p>
        </div>
      </div>
      {current?.stories.length?<div className="grid gap-x-4 gap-y-6" style={{gridTemplateColumns:"repeat(auto-fill,minmax(min(46%,180px),1fr))"}}>{current.stories.map(s=><StoryTile key={s.id} story={s} wide showTag={false}/>)}</div>
        :<div className="card p-10 text-center text-mut">{t("stories.none")}</div>}
    </section>:groups.length?<div className="pt-4">{groups.map(g=><Rail key={g.category} title={t(categoryLabelKey(g.category))} href={"/stories?c="+g.category} action={t("home.seeAll")}>{g.stories.slice(0,14).map(s=><StoryTile key={s.id} story={s} showTag={false}/>)}</Rail>)}</div>
    :<section className="container-site"><div className="card p-10 text-center text-mut">{t("stories.none")}</div></section>}

    <section className="container-site pb-4">
      <Link href="/stories/adult" className="flex items-center justify-between gap-4 rounded-[24px] border border-coral/30 bg-coral/[0.08] p-5 transition hover:border-coral/50 min-[760px]:p-6">
        <div className="flex items-center gap-4"><span className="rounded-full bg-coral px-2.5 py-1 text-xs font-extrabold text-white">18+</span><div><p className="text-lg font-extrabold">{t("stories.adultTitle")}</p><p className="text-sm text-mut">{t("stories.adultBody")}</p></div></div>
        <ChevronRight className="h-5 w-5 shrink-0 text-mut rtl:rotate-180"/>
      </Link>
    </section>
    <SiteFooter/>
  </main>;
}
