"use client";

import Link from "next/link";
import AppHeader from "../AppHeader";
import SiteFooter from "../SiteFooter";
import CategoryCarousel from "./CategoryCarousel";
import PersonalShelves from "./PersonalShelves";
import StoryTile, { Shelf } from "../StoryTile";
import { useApp } from "../AppProvider";
import { CATEGORY_STYLE, categoryLabelKey, type CategoryKey } from "../../lib/categories";
import type { CategoryPick, StoryCard } from "../../lib/server/catalog";

/** Home for signed-in listeners: a moving hero with one story per category, then personal and category shelves. */
export default function SignedInHome({picks,groups,newest}:{picks:CategoryPick[];groups:{category:CategoryKey;stories:StoryCard[]}[];newest:StoryCard[]}){
  const {t,user}=useApp();
  const name=user?.displayName?.split(" ")[0];
  return <main className="page-glow min-h-screen">
    <AppHeader/>
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-8 md:pt-10">
      <p className="text-sm font-medium text-amber-300">{name?t("home.welcome",{name}):t("home.welcomeAnon")}</p>
      <div className="mb-5 mt-1 flex items-end justify-between gap-4">
        <div><h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{t("home.heroTitle")}</h1><p className="mt-1 text-sm text-zinc-400">{t("home.heroSub")}</p></div>
        <Link href="/stories" className="hidden shrink-0 text-sm font-medium text-amber-300 hover:text-amber-200 sm:block">{t("home.seeAll")}</Link>
      </div>
      {picks.length?<CategoryCarousel picks={picks}/>:<div className="glass rounded-3xl p-10 text-center text-zinc-400">{t("home.empty")}</div>}
    </section>

    {groups.length>0&&<section className="mx-auto max-w-7xl px-4 pb-10 md:px-8">
      <h2 className="mb-4 font-display text-xl font-semibold md:text-2xl">{t("home.categories")}</h2>
      <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {groups.map(g=><Link key={g.category} href={"/stories?c="+g.category} className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-amber-300/40 hover:bg-white/[0.08]"><span>{CATEGORY_STYLE[g.category].emoji}</span>{t(categoryLabelKey(g.category))}</Link>)}
      </div>
    </section>}

    <PersonalShelves/>

    {newest.length>0&&<Shelf title={t("home.new")} href="/stories" action={t("home.seeAll")}>{newest.map(s=><StoryTile key={s.id} story={s}/>)}</Shelf>}
    {groups.map(g=><Shelf key={g.category} title={<>{CATEGORY_STYLE[g.category].emoji} {t(categoryLabelKey(g.category))}</>} href={"/stories?c="+g.category} action={t("home.seeAll")}>{g.stories.slice(0,12).map(s=><StoryTile key={s.id} story={s}/>)}</Shelf>)}
    <SiteFooter/>
  </main>;
}
