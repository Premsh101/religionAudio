"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { Headphones } from "lucide-react";
import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import ItemCard from "../../components/home/ItemCard";
import { useT } from "../../components/AppProvider";
import { photoUrl } from "../../lib/categories";
import type { FeedItem } from "../../lib/server/recommendations";

export type BookCard={slug:string;title:string;tradition:string;edition:string;summary:string|null;coverUrl:string|null};
type Tab="saved"|"progress"|"books";

const TRADITION_COLOR:Record<string,string>={Buddhism:"#B061FF",Judaism:"#1E88E5",Christianity:"#1E9E5A","Sacred texts":"#E8590C"};
function bookPhoto(title:string){
  if(/dhammapada/i.test(title))return photoUrl("book-open");
  if(/genesis/i.test(title))return photoUrl("lake-dawn");
  if(/exodus/i.test(title))return photoUrl("adventure");
  return photoUrl("book-stack");
}
const bookHref=(slug:string)=>"/read/"+slug;

export default function LibraryClient({books,saved,inProgress,signedIn,initialTab}:{books:BookCard[];saved:FeedItem[];inProgress:FeedItem[];signedIn:boolean;initialTab:Tab}){
  const t=useT();
  const [tab,setTab]=useState<Tab>(initialTab);
  const tabs:[Tab,string][]=[["saved",t("library.saved")],["progress",t("library.inProgress")],["books",t("library.books")]];
  const grid=(items:FeedItem[],progress:boolean,empty:string)=>!signedIn?<div className="card p-8 text-center"><p className="text-mut">{t("library.loginToSee")}</p><Link href="/login" className="btn-primary mt-5">{t("nav.login")}</Link></div>
    :items.length?<div className="grid gap-x-4 gap-y-6" style={{gridTemplateColumns:"repeat(auto-fill,minmax(min(46%,180px),1fr))"}}>{items.map(i=><div key={i.kind+i.id} className="[&>a]:!w-full [&>a]:!max-w-none"><ItemCard item={i} showProgress={progress}/></div>)}</div>
    :<div className="card p-8 text-center text-mut">{empty}</div>;

  return <main className="min-h-screen">
    <AppHeader/>
    <section className="container-site pb-6 pt-8 min-[760px]:pt-10">
      <h1 className="h-page">{t("library.yours")}</h1>
      <div role="tablist" className="mt-6 inline-flex rounded-full border border-line bg-chip p-1.5">
        {tabs.map(([key,label])=><button key={key} role="tab" aria-selected={tab===key} onClick={()=>setTab(key)} className={"rounded-full px-4 py-2 text-sm font-extrabold transition min-[480px]:px-5 "+(tab===key?"bg-ink text-bg":"text-mut hover:text-ink")}>{label}</button>)}
      </div>
    </section>
    <section className="container-site pb-6">
      {tab==="saved"&&grid(saved,false,t("library.emptySaved"))}
      {tab==="progress"&&grid(inProgress,true,t("library.emptyProgress"))}
      {tab==="books"&&(books.length?<div className="grid gap-4 min-[900px]:grid-cols-2">
        {books.map(b=>{
          const color=TRADITION_COLOR[b.tradition]||"#E8590C";
          return <Link key={b.slug} href={bookHref(b.slug)} className="lift card group flex items-center gap-5 p-4">
            <div className="relative aspect-[3/4] w-[110px] shrink-0 overflow-hidden rounded-[16px]" style={{background:color}}>
              <img src={b.coverUrl||bookPhoto(b.title)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover"/>
              <div className="absolute inset-0" style={{background:`linear-gradient(165deg, ${color}99, transparent 55%)`}}/>
            </div>
            <div className="min-w-0">
              <p className="eyebrow" style={{color}}>{b.tradition}</p>
              <h2 className="mt-1.5 font-display text-[30px] leading-none">{b.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-mut">{b.summary||b.edition}</p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-extrabold text-bg"><Headphones className="h-4 w-4"/>{t("library.open")}</span>
            </div>
          </Link>;
        })}
      </div>:<div className="card p-8 text-center text-mut">{t("library.none")}</div>)}
    </section>
    <SiteFooter/>
  </main>;
}
