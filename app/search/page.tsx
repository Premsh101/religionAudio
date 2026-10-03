"use client";
/* eslint-disable @next/next/no-img-element */
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Search as SearchIcon } from "lucide-react";
import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import StoryTile from "../../components/StoryTile";
import { useT } from "../../components/AppProvider";
import { CATEGORY_STYLE, categoryLabelKey, categoryPhoto, type CategoryKey } from "../../lib/categories";
import type { StoryCard } from "../../lib/server/catalog";

type Result={query:string;works:Array<{id:string;title:string;slug:string;edition:string|null;translator:string|null;language:string}>;passages:Array<{id:string;reference:string;text:string;work:{title:string;slug:string;source:{name:string}|null}}>;stories:Array<{id:string;title:string;slug:string;ageMin:number|null;summary:string|null;category:CategoryKey;coverUrl:string|null}>};

const POPULAR=["Ramayana","Diwali","Krishna","Buddha","Guru Nanak","Dhammapada"];
const GENRES:CategoryKey[]=["epics","mythology","children","festivals","adventure","ghost","crime","romance","sacred-places","inspirational","folklore","moral-tales"];

function SearchInner(){
  const t=useT();
  const router=useRouter();
  const params=useSearchParams();
  const initial=params.get("q")||"";
  const [q,setQ]=useState(initial);
  const [loading,setLoading]=useState(false);
  const [results,setResults]=useState<Result|null>(null);

  useEffect(()=>{
    const query=initial.trim();
    setQ(initial);
    if(query.length<2){setResults(null);return}
    let cancelled=false;
    setLoading(true);
    fetch("/api/search?q="+encodeURIComponent(query)).then(r=>r.ok?r.json():null).then(d=>{if(!cancelled)setResults(d)}).finally(()=>{if(!cancelled)setLoading(false)});
    return()=>{cancelled=true};
  },[initial]);

  const go=(value:string)=>router.push("/search?q="+encodeURIComponent(value.trim()));
  const total=results?results.works.length+results.passages.length+results.stories.length:0;
  const asCard=(s:Result["stories"][number]):StoryCard=>({id:s.id,slug:s.slug,title:s.title,summary:s.summary||"",coverUrl:s.coverUrl,category:s.category,ageMin:s.ageMin,isNew:false,translated:[],minutes:null,popularity:0});

  return <main className="min-h-screen">
    <AppHeader/>
    <section className="mx-auto w-full max-w-[1100px] px-[18px] pb-6 pt-8 min-[760px]:px-10 min-[760px]:pt-10">
      <form role="search" onSubmit={e=>{e.preventDefault();if(q.trim().length>=2)go(q)}} className="flex h-16 items-center gap-3 rounded-full border border-line2 bg-card px-6 shadow-card">
        <SearchIcon className="h-[22px] w-[22px] shrink-0 text-mut2"/>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder={t("search.placeholder")} aria-label={t("nav.search")} className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-mut2"/>
        {loading&&<span className="text-sm text-mut2">{t("common.loading")}</span>}
      </form>

      {!results?<>
        <p className="eyebrow mt-8 text-mut2">{t("search.popular")}</p>
        <div className="mt-3 flex flex-wrap gap-2">{POPULAR.map(p=><button key={p} onClick={()=>go(p)} className="chip !bg-card">{p}</button>)}</div>
        <p className="eyebrow mt-8 text-mut2">{t("search.genres")}</p>
        <div className="mt-3 grid gap-3" style={{gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,240px),1fr))"}}>
          {GENRES.map(g=><Link key={g} href={"/stories?c="+g} className="lift relative flex h-24 items-center overflow-hidden rounded-[18px] px-4" style={{background:CATEGORY_STYLE[g].color}}>
            <span className="relative z-10 max-w-[60%] text-lg font-extrabold leading-tight text-white">{t(categoryLabelKey(g))}</span>
            <img src={categoryPhoto(g)} alt="" loading="lazy" className="absolute -end-3 top-2 h-24 w-24 rotate-[18deg] rounded-xl object-cover shadow-lg"/>
          </Link>)}
        </div>
      </>:<>
        <p className="mt-8 text-sm font-semibold text-mut">{total?t("search.results",{n:total,q:results.query}):t("search.none",{q:results.query})}</p>
        {results.stories.length>0&&<><h2 className="h-rail mb-4 mt-6">{t("search.stories")}</h2>
          <div className="grid gap-x-4 gap-y-6" style={{gridTemplateColumns:"repeat(auto-fill,minmax(min(46%,170px),1fr))"}}>{results.stories.map(s=><StoryTile key={s.slug} story={asCard(s)} wide/>)}</div></>}
        {results.works.length>0&&<><h2 className="h-rail mb-4 mt-10">{t("search.books")}</h2>
          <div className="grid gap-3 min-[760px]:grid-cols-2">{results.works.map(w=><Link key={w.id} href={"/read/"+w.slug} className="card flex items-center gap-4 p-4 hover:border-line2"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple/15 text-purple"><BookOpen className="h-5 w-5"/></span><span><span className="block font-extrabold">{w.title}</span><span className="text-sm text-mut">{w.edition||w.translator||w.language}</span></span></Link>)}</div></>}
        {results.passages.length>0&&<><h2 className="h-rail mb-4 mt-10">{t("search.passages")}</h2>
          <div className="space-y-3">{results.passages.map(p=><Link key={p.id} href={"/read/"+p.work.slug} className="card block p-5 hover:border-line2">
            <div className="flex items-center justify-between gap-3 text-xs font-extrabold"><span className="uppercase tracking-[.12em] text-purple">{p.work.title}</span><span className="text-mut2">{p.reference}</span></div>
            <p className="mt-3 whitespace-pre-line font-display text-[20px] leading-[1.45]">{p.text}</p>
          </Link>)}</div></>}
      </>}
    </section>
    <SiteFooter/>
  </main>;
}

export default function SearchPage(){
  return <Suspense><SearchInner/></Suspense>;
}
