"use client";

import Link from "next/link";
import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import StoryTile, { Shelf } from "../../components/StoryTile";
import { useT } from "../../components/AppProvider";
import { CATEGORY_STYLE, categoryBlurbKey, categoryGradient, categoryLabelKey, type CategoryKey } from "../../lib/categories";
import type { StoryCard } from "../../lib/server/catalog";

export default function StoriesBrowser({groups,active}:{groups:{category:CategoryKey;stories:StoryCard[]}[];active:CategoryKey|null}){
  const t=useT();
  const current=active?groups.find(g=>g.category===active):null;
  const chip=(on:boolean)=>"flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition "+(on?"border-amber-300 bg-amber-300 text-black":"border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10");
  return <main className="page-glow min-h-screen">
    <AppHeader/>
    <section className="mx-auto max-w-7xl px-4 pb-6 pt-8 md:px-8 md:pt-12">
      <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{t("stories.title")}</h1>
      <p className="mt-2 text-zinc-400">{t("stories.sub")}</p>
      <nav className="scrollbar-hide -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0">
        <Link href="/stories" className={chip(!active)} scroll={false}>{t("stories.all")}</Link>
        {groups.map(g=><Link key={g.category} href={"/stories?c="+g.category} scroll={false} className={chip(active===g.category)}><span>{CATEGORY_STYLE[g.category].emoji}</span>{t(categoryLabelKey(g.category))}</Link>)}
      </nav>
    </section>

    {active?<section className="mx-auto max-w-7xl px-4 pb-10 md:px-8">
      <div className="relative mb-8 overflow-hidden rounded-3xl p-6 ring-1 ring-white/10 md:p-8" style={{background:categoryGradient(active)}}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/10 rtl:bg-gradient-to-l"/>
        <div className="relative flex items-center gap-4">
          <span className="text-5xl">{CATEGORY_STYLE[active].emoji}</span>
          <div><h2 className="font-display text-2xl font-semibold text-white md:text-3xl">{t(categoryLabelKey(active))}</h2><p className="mt-1 text-white/80">{t(categoryBlurbKey(active))} · {t("stories.count",{n:current?.stories.length||0})}</p></div>
        </div>
      </div>
      {current?.stories.length?<div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{current.stories.map(s=><StoryTile key={s.id} story={s} wide/>)}</div>
        :<div className="glass rounded-3xl p-10 text-center text-zinc-400">{t("stories.none")}</div>}
    </section>:groups.length?groups.map(g=><Shelf key={g.category} title={<>{CATEGORY_STYLE[g.category].emoji} {t(categoryLabelKey(g.category))}</>} href={"/stories?c="+g.category} action={t("home.seeAll")}>{g.stories.slice(0,14).map(s=><StoryTile key={s.id} story={s}/>)}</Shelf>)
    :<section className="mx-auto max-w-7xl px-4 md:px-8"><div className="glass rounded-3xl p-10 text-center text-zinc-400">{t("stories.none")}</div></section>}

    <section className="mx-auto max-w-7xl px-4 pb-6 md:px-8">
      <Link href="/stories/adult" className="flex items-center justify-between gap-4 rounded-3xl border border-rose-300/15 bg-rose-300/[0.04] p-6 transition hover:border-rose-300/30">
        <div><div className="flex items-center gap-2"><span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">18+</span><span className="font-display text-xl font-semibold">{t("stories.adultTitle")}</span></div><p className="mt-2 text-sm text-zinc-400">{t("stories.adultBody")}</p></div>
        <span className="shrink-0 text-sm font-medium text-zinc-300">{t("stories.enter")} →</span>
      </Link>
    </section>
    <SiteFooter/>
  </main>;
}
