"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Check, Headphones, Moon, Play } from "lucide-react";
import AppHeader from "../AppHeader";
import SiteFooter from "../SiteFooter";
import StoryTile, { Cover, Rail } from "../StoryTile";
import Waveform from "../player/Waveform";
import { useApp } from "../AppProvider";
import { LOCALES, LOCALE_NAMES } from "../../lib/i18n/config";
import { CATEGORY_KEYS, CATEGORY_STYLE, categoryBlurbKey, categoryLabelKey, categoryPhoto, photoUrl, type CategoryKey } from "../../lib/categories";
import type { CategoryPick, StoryCard } from "../../lib/server/catalog";

const DESIGN_CATS:CategoryKey[]=["epics","mythology","children","festivals","adventure","ghost","crime","romance","sacred-places","inspirational","folklore","moral-tales"];

export function CategoryTile({category,count,href}:{category:CategoryKey;count?:number;href:string}){
  const {t}=useApp();
  const color=CATEGORY_STYLE[category].color;
  return <Link href={href} className="lift group relative block aspect-[4/5] overflow-hidden rounded-[24px]" style={{background:color}}>
    <img src={categoryPhoto(category)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
    <div className="absolute inset-0" style={{background:`linear-gradient(165deg, ${color}99 0%, rgba(0,0,0,0) 50%)`}}/>
    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(9,7,20,.92)] via-[rgba(9,7,20,.3)] to-transparent"/>
    {typeof count==="number"&&count>0&&<span className="absolute start-3.5 top-3.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] text-white" style={{background:color}}>{t("landing.titlesCount",{n:count})}</span>}
    <div className="absolute inset-x-0 bottom-0 p-4">
      <h3 className="font-display text-[28px] leading-none text-white">{t(categoryLabelKey(category))}</h3>
      <p className="mt-1.5 text-xs font-medium leading-snug text-white/80">{t(categoryBlurbKey(category))}</p>
    </div>
  </Link>;
}

/** Public landing page for visitors who aren't signed in. */
export default function Landing({picks,sample,counts}:{picks:CategoryPick[];sample:StoryCard[];counts:Partial<Record<CategoryKey,number>>}){
  const {t,locale}=useApp();
  const withStory=picks.filter(p=>p.story);
  const hero=[0,1,2].map(i=>withStory[i]?.story||null);
  const heroCats:CategoryKey[]=[withStory[0]?.category||"epics",withStory[1]?.category||"children",withStory[2]?.category||"ghost"];
  const shown=(picks.length?picks.map(p=>p.category):DESIGN_CATS).slice(0,12);
  const nowPlaying=hero[1]||hero[0];

  return <main className="min-h-screen">
    <AppHeader/>

    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={{background:"radial-gradient(50% 60% at 15% 0%,rgba(255,176,32,.18),transparent 70%),radial-gradient(45% 55% at 90% 15%,rgba(123,97,255,.22),transparent 70%)"}}/>
      <div className="container-site relative grid items-center gap-12 pb-16 pt-12 min-[760px]:pb-24 min-[760px]:pt-20" style={{gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,460px),1fr))"}}>
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-sun/30 bg-sun/10 px-3.5 py-1.5 text-xs font-extrabold text-acc"><Headphones className="h-3.5 w-3.5"/>{t("landing.badge")}</span>
          <h1 className="mt-6 font-display text-[46px] leading-[.98] tracking-[-.02em] min-[480px]:text-[60px] min-[900px]:text-[72px] min-[1200px]:text-[86px]">{t("landing.title1")}<br/><em className="text-gradient pe-2">{t("landing.title2")}</em></h1>
          <p className="mt-6 max-w-xl text-[17px] leading-[1.65] text-mut">{t("landing.subtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary"><Play className="h-4 w-4 fill-current"/>{t("landing.cta")}</Link>
            <Link href="/stories" className="btn-outline">{t("landing.browse")}</Link>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-mut">
            {(["landing.trust1","landing.trust2","landing.trust3"] as const).map(k=><li key={k} className="flex items-center gap-2"><Check className="h-4 w-4 text-teal"/>{t(k)}</li>)}
          </ul>
        </div>

        <div className="relative mx-auto h-[420px] w-full max-w-[520px] min-[760px]:h-[460px]" aria-hidden>
          {[0,1,2].map(i=>{
            const s=hero[i];
            const pos=["start-0 top-10 w-[42%] -rotate-[7deg]","inset-x-0 top-0 z-10 mx-auto w-[46%]","end-0 top-12 w-[42%] rotate-[7deg]"][i];
            return <div key={i} className={"absolute "+pos}><Cover title={s?.title||t(categoryLabelKey(heroCats[i]))} category={s?.category||heroCats[i]} coverUrl={s?.coverUrl} seed={s?.slug||heroCats[i]} sub={s?.minutes?`${s.minutes} min`:undefined} size="md"/></div>;
          })}
          <div className="absolute inset-x-2 bottom-2 z-20 flex items-center gap-3 rounded-[20px] border border-line2 bg-card/90 p-3 shadow-card backdrop-blur-xl min-[760px]:bottom-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#1A0E00]" style={{background:"linear-gradient(135deg,#FFB020,#FF5A5F)"}}><Play className="ms-0.5 h-4 w-4 fill-current"/></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-xs font-bold"><span className="truncate" dir="auto">{nowPlaying?.title||t("landing.trust3")}</span>{nowPlaying?.minutes?<span className="shrink-0 text-mut2">{nowPlaying.minutes} min</span>:null}</div>
              <div className="mt-2"><Waveform seed={nowPlaying?.slug||"sunave"} progress={0.38} bars={48} height={26}/></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Categories */}
    <section className="container-site pb-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><h2 className="h-section">{t("landing.categoriesTitle")}</h2><p className="mt-2 text-mut">{t("landing.categoriesSub")}</p></div>
        <Link href="/stories" className="shrink-0 text-sm font-extrabold text-acc">{t("home.seeAll")} →</Link>
      </div>
      <div className="grid gap-4" style={{gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,230px),1fr))"}}>
        {shown.map(key=><CategoryTile key={key} category={key} count={counts[key]} href={"/stories?c="+key}/>)}
      </div>
    </section>

    {sample.length>0&&<Rail big title={t("landing.tryTitle")} href="/stories" action={t("home.seeAll")}>{sample.map(s=><StoryTile key={s.id} story={s}/>)}</Rail>}

    {/* Features */}
    <section className="container-site pb-16">
      <h2 className="h-section">{t("landing.featuresTitle")}</h2>
      <p className="mt-2 text-mut">{t("landing.featuresSub")}</p>
      <div className="mt-8 grid gap-4" style={{gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))"}}>
        <div className="card p-5">
          <div className="space-y-1 font-display text-[17px] leading-snug">
            <p className="px-2 text-mut2">The woodcutter sat by the river.</p>
            <p className="rounded-lg bg-hl px-2 py-1 text-ink">His only axe had slipped into the water.</p>
            <p className="px-2 text-mut2">He wept, and the river answered.</p>
          </div>
          <h3 className="mt-5 font-extrabold">{t("landing.f1t")}</h3><p className="mt-1.5 text-sm leading-relaxed text-mut">{t("landing.f1b")}</p>
        </div>
        <div className="card p-5">
          <div className="flex flex-wrap gap-2">{["0.8×","1×","1.25×","1.5×"].map(s=><span key={s} className={"rounded-full px-3 py-1.5 text-xs font-extrabold "+(s==="1×"?"bg-violet text-white":"bg-chip text-ink")}>{s}</span>)}<span className="inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-3 py-1.5 text-xs font-extrabold text-teal"><Moon className="h-3.5 w-3.5"/>{t("landing.sleep30")}</span></div>
          <h3 className="mt-5 font-extrabold">{t("landing.f2t")}</h3><p className="mt-1.5 text-sm leading-relaxed text-mut">{t("landing.f2b")}</p>
        </div>
        <div className="card p-5">
          <div className="flex flex-wrap gap-2">{LOCALES.map(l=><span key={l} lang={l} className={"rounded-full px-3 py-1.5 text-xs font-extrabold "+(l===locale?"bg-coral text-white":"bg-chip text-ink")}>{LOCALE_NAMES[l]}</span>)}</div>
          <h3 className="mt-5 font-extrabold">{t("landing.langTitle")}</h3><p className="mt-1.5 text-sm leading-relaxed text-mut">{t("landing.langBody")}</p>
        </div>
        <div className="card p-5">
          <div className="flex flex-wrap gap-2"><span className="rounded-full bg-teal/15 px-3 py-1.5 text-xs font-extrabold text-teal">{t("stories.ages",{age:4})}</span><span className="rounded-full bg-sky/15 px-3 py-1.5 text-xs font-extrabold text-sky">{t("stories.ages",{age:7})}</span><span className="rounded-full bg-coral/15 px-3 py-1.5 text-xs font-extrabold text-coral">{t("landing.locked")}</span></div>
          <h3 className="mt-5 font-extrabold">{t("landing.familyTitle")}</h3><p className="mt-1.5 text-sm leading-relaxed text-mut">{t("landing.familyBody")}</p>
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="container-site pb-16">
      <h2 className="h-section text-center">{t("landing.howTitle")}</h2>
      <div className="mt-8 grid gap-4" style={{gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))"}}>
        {([["landing.step1t","landing.step1b","linear-gradient(135deg,#FFB020,#FF7A3D)"],["landing.step2t","landing.step2b","linear-gradient(135deg,#B061FF,#FF4FA3)"],["landing.step3t","landing.step3b","linear-gradient(135deg,#14C8B0,#3BA8FF)"]] as const).map(([title,body,bg],i)=><div key={title} className="card flex items-start gap-4 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-[30px] leading-none text-white" style={{background:bg}}>{i+1}</span>
          <div><h3 className="font-extrabold">{t(title)}</h3><p className="mt-1 text-sm leading-relaxed text-mut">{t(body)}</p></div>
        </div>)}
      </div>
    </section>

    {/* Final call to action */}
    <section className="container-site pb-6">
      <div className="relative overflow-hidden rounded-[34px] p-8 min-[760px]:p-14">
        <img src={photoUrl("cta-books")} alt="" className="absolute inset-0 h-full w-full object-cover object-right"/>
        <div className="absolute inset-0" style={{background:"linear-gradient(90deg,#FF7A3D 0%,rgba(255,90,95,.92) 38%,rgba(123,97,255,.55) 75%,rgba(123,97,255,.25) 100%)"}}/>
        <div className="relative max-w-xl">
          <h2 className="font-display text-[38px] leading-[1.02] tracking-[-.02em] text-white min-[760px]:text-[52px]">{t("landing.finalTitle")}</h2>
          <p className="mt-3 font-medium text-white/85">{t("landing.finalBody")}</p>
          <Link href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#120F24] px-6 py-3.5 text-[15px] font-extrabold text-white transition hover:bg-black">{t("landing.cta")}<ArrowRight className="h-4 w-4 rtl:rotate-180"/></Link>
        </div>
      </div>
    </section>

    <SiteFooter/>
  </main>;
}
