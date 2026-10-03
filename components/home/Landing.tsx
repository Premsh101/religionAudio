"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Check, Headphones, Languages, MousePointerClick, RotateCcw, ShieldCheck } from "lucide-react";
import AppHeader from "../AppHeader";
import SiteFooter from "../SiteFooter";
import StoryTile, { Shelf, StoryCover } from "../StoryTile";
import { useApp } from "../AppProvider";
import { LOCALES, LOCALE_NAMES } from "../../lib/i18n/config";
import { CATEGORY_KEYS, CATEGORY_STYLE, categoryBlurbKey, categoryGradient, categoryLabelKey, type CategoryKey } from "../../lib/categories";
import type { CategoryPick, StoryCard } from "../../lib/server/catalog";

/** Public landing page for visitors who aren't signed in. */
export default function Landing({picks,sample}:{picks:CategoryPick[];sample:StoryCard[]}){
  const {t}=useApp();
  const shown:CategoryKey[]=picks.length?picks.map(p=>p.category).slice(0,8):CATEGORY_KEYS.slice(0,8);
  const collage=picks.filter(p=>p.story).slice(0,3);
  const fallback:CategoryKey[]=["epics","festivals","children"];

  return <main className="min-h-screen">
    <AppHeader/>

    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_20%_10%,rgba(245,158,11,.22),transparent_70%),radial-gradient(45%_55%_at_85%_20%,rgba(168,85,247,.25),transparent_70%)]"/>
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-[1.1fr_.9fr]">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3.5 py-1.5 text-xs font-semibold text-amber-200"><Headphones className="h-3.5 w-3.5"/>{t("landing.badge")}</span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">{t("landing.title1")}<br/><span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-transparent">{t("landing.title2")}</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">{t("landing.subtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-7 py-4 text-base font-semibold text-black shadow-lg shadow-amber-500/20 transition hover:bg-amber-200">{t("landing.cta")}<ArrowRight className="h-5 w-5 rtl:rotate-180"/></Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 text-base font-medium text-white transition hover:bg-white/5">{t("landing.login")}</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
            {(["landing.trust1","landing.trust2","landing.trust3"] as const).map(k=><li key={k} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400"/>{t(k)}</li>)}
          </ul>
        </div>

        <div className="relative mx-auto hidden h-[460px] w-full max-w-lg sm:block" aria-hidden>
          {[0,1,2].map(i=>{
            const pick=collage[i];
            const pos=["start-0 top-16 w-40 [--r:-7deg]","inset-x-0 top-0 z-10 mx-auto w-52 [--r:0deg]","end-0 top-20 w-40 [--r:7deg]"][i];
            return <div key={i} className={"float-slow absolute "+pos} style={{animationDelay:`${i*1.2}s`}}>
              {pick?.story?<StoryCover title={pick.story.title} category={pick.category} coverUrl={pick.story.coverUrl} large/>:<StoryCover title={t(categoryLabelKey(fallback[i]))} category={fallback[i]} coverUrl={null} large/>}
            </div>;
          })}
          <div className="absolute inset-x-6 bottom-6 z-20 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 p-3 backdrop-blur-xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-300 text-black"><Headphones className="h-5 w-5"/></span>
            <div className="min-w-0 flex-1"><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/5 rounded-full bg-amber-300"/></div><p className="mt-2 truncate text-xs text-zinc-400">{t("landing.trust3")}</p></div>
          </div>
        </div>
      </div>
    </section>

    {/* Categories */}
    <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
      <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{t("landing.categoriesTitle")}</h2>
      <p className="mt-2 text-zinc-400">{t("landing.categoriesSub")}</p>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {shown.map(key=><Link key={key} href={"/stories?c="+key} className="group relative overflow-hidden rounded-3xl p-5 ring-1 ring-white/10 transition hover:-translate-y-1 md:p-6" style={{background:categoryGradient(key)}}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
          <div className="relative">
            <span className="text-3xl md:text-4xl">{CATEGORY_STYLE[key].emoji}</span>
            <h3 className="mt-6 text-lg font-semibold text-white md:mt-10 md:text-xl">{t(categoryLabelKey(key))}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-white/75">{t(categoryBlurbKey(key))}</p>
          </div>
        </Link>)}
      </div>
    </section>

    {sample.length>0&&<Shelf title={t("landing.tryTitle")} href="/stories" action={t("home.seeAll")}>{sample.map(s=><StoryTile key={s.id} story={s}/>)}</Shelf>}

    {/* How it works */}
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h2 className="text-center font-display text-3xl font-semibold tracking-tight md:text-4xl">{t("landing.howTitle")}</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {([[MousePointerClick,"landing.step1t","landing.step1b"],[Headphones,"landing.step2t","landing.step2b"],[RotateCcw,"landing.step3t","landing.step3b"]] as const).map(([Icon,title,body],i)=><div key={title} className="glass rounded-3xl p-7">
          <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-300"><Icon className="h-6 w-6"/></span><span className="font-display text-4xl font-semibold text-white/10">{i+1}</span></div>
          <h3 className="mt-6 text-xl font-semibold">{t(title)}</h3>
          <p className="mt-2 leading-7 text-zinc-400">{t(body)}</p>
        </div>)}
      </div>
    </section>

    {/* Languages + family */}
    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-2 md:px-8">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/15 to-transparent p-8">
        <Languages className="h-8 w-8 text-sky-300"/>
        <h3 className="mt-5 font-display text-2xl font-semibold">{t("landing.langTitle")}</h3>
        <p className="mt-2 leading-7 text-zinc-400">{t("landing.langBody")}</p>
        <div className="mt-5 flex flex-wrap gap-2">{LOCALES.map(l=><span key={l} lang={l} className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-white">{LOCALE_NAMES[l]}</span>)}</div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 to-transparent p-8">
        <ShieldCheck className="h-8 w-8 text-emerald-300"/>
        <h3 className="mt-5 font-display text-2xl font-semibold">{t("landing.familyTitle")}</h3>
        <p className="mt-2 leading-7 text-zinc-400">{t("landing.familyBody")}</p>
        <Link href="/library" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:text-emerald-200"><BookOpenText className="h-4 w-4"/>{t("nav.library")}</Link>
      </div>
    </section>

    {/* Final call to action */}
    <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 p-10 text-center text-black md:p-16">
        <div className="absolute -start-10 -top-10 h-48 w-48 rounded-full bg-white/30 blur-3xl"/>
        <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-5xl">{t("landing.finalTitle")}</h2>
        <p className="relative mt-3 text-black/70">{t("landing.finalBody")}</p>
        <Link href="/signup" className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 font-semibold text-white transition hover:bg-zinc-800">{t("landing.cta")}<ArrowRight className="h-5 w-5 rtl:rotate-180"/></Link>
      </div>
    </section>

    <SiteFooter/>
  </main>;
}
