"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, Clock3, Globe, KeyRound, LogOut } from "lucide-react";
import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import { Field, FormError, PasswordInput, primaryButton } from "../../components/AuthShell";
import { setLocale, useApp } from "../../components/AppProvider";
import { LOCALES, LOCALE_NAMES } from "../../lib/i18n/config";
import { apiError } from "../../lib/i18n/messages";

type WorkProgress={id:string;progressPercent:number;currentSequence:number;updatedAt:string;work:{title:string;slug:string}};
type StoryProgress={id:string;progressPercent:number;currentScene:number;updatedAt:string;story:{title:string;slug:string;summary:string|null}};
type BookmarkRow={id:string;work:{title:string;slug:string}|null;story:{title:string;slug:string}|null;createdAt:string};

const bookHref=(slug:string)=>"/read/"+slug;

function ChangePassword(){
  const {t}=useApp();
  const [current,setCurrent]=useState("");
  const [next,setNext]=useState("");
  const [confirm,setConfirm]=useState("");
  const [error,setError]=useState("");
  const [done,setDone]=useState(false);
  const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault();setError("");setDone(false);
    if(next!==confirm){setError(t("auth.mismatch"));return}
    setBusy(true);
    try{
      const res=await fetch("/api/user/password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:current,newPassword:next})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok){setError(apiError(t,res.status,data));return}
      setDone(true);setCurrent("");setNext("");setConfirm("");
    }catch{setError(t("auth.failed"))}finally{setBusy(false)}
  }
  return <form onSubmit={submit} className="space-y-4">
    <Field label={t("settings.current")}><PasswordInput value={current} onChange={setCurrent} autoComplete="current-password"/></Field>
    <Field label={t("settings.new")} hint={t("auth.pwHint")}><PasswordInput value={next} onChange={setNext} autoComplete="new-password" minLength={8}/></Field>
    <Field label={t("settings.confirmNew")}><PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={8}/></Field>
    <FormError message={error}/>
    {done&&<div role="status" className="flex items-center gap-2 rounded-2xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm font-semibold text-teal"><Check className="h-4 w-4"/>{t("settings.updated")}</div>}
    <button disabled={busy} className={primaryButton+" sm:w-auto"}>{busy?t("settings.updating"):t("settings.update")}</button>
  </form>;
}

export default function AccountPage(){
  const {user,t,locale}=useApp();
  const [works,setWorks]=useState<WorkProgress[]>([]);
  const [stories,setStories]=useState<StoryProgress[]>([]);
  const [bookmarks,setBookmarks]=useState<BookmarkRow[]>([]);

  useEffect(()=>{
    if(!user)return;
    Promise.all([fetch("/api/user/progress"),fetch("/api/user/bookmarks")]).then(async([progressRes,bookmarkRes])=>{
      if(progressRes.ok){const data=await progressRes.json();setWorks(data.works||[]);setStories(data.stories||[])}
      if(bookmarkRes.ok){const data=await bookmarkRes.json();setBookmarks(data.bookmarks||[])}
    }).catch(()=>{});
  },[user]);

  async function logout(){await fetch("/api/auth/logout",{method:"POST"});window.location.href="/"}

  const recent=[
    ...works.map(p=>({type:"book",title:p.work.title,href:bookHref(p.work.slug),percent:p.progressPercent,updatedAt:p.updatedAt})),
    ...stories.map(p=>({type:"story",title:p.story.title,href:"/stories/"+p.story.slug,percent:p.progressPercent,updatedAt:p.updatedAt}))
  ].sort((a,b)=>new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()).slice(0,6);

  const card="card rounded-3xl p-6 md:p-7";
  return <main className="min-h-screen">
    <AppHeader/>
    <section className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
      {!user?<div className={card+" text-center"}><p className="text-ink">{t("settings.loginPrompt")}</p><Link href="/login" className="mt-5 inline-flex rounded-full btn-primary px-6 py-3 font-semibold text-black">{t("nav.login")}</Link></div>:<>
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple to-pink text-2xl font-semibold uppercase text-ink">{(user.displayName||user.email||user.phone||"U")[0]}</span>
          <div className="min-w-0"><h1 className="truncate font-display text-4xl">{user.displayName||t("settings.title")}</h1><p className="truncate text-sm text-mut">{t("settings.signedInAs")} <span dir="ltr">{user.email||user.phone}</span></p></div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section className={card}>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Globe className="h-5 w-5 text-sky"/>{t("settings.language")}</h2>
            <p className="mt-1 text-sm text-mut">{t("settings.languageSub")}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">{LOCALES.map(l=><button key={l} lang={l} onClick={()=>l!==locale&&setLocale(l)} aria-pressed={l===locale} className={"flex items-center justify-between rounded-2xl border px-4 py-3 text-start transition "+(l===locale?"border-orange bg-orange/10 text-ink":"border-line text-ink hover:bg-chip")}>{LOCALE_NAMES[l]}{l===locale&&<Check className="h-4 w-4"/>}</button>)}</div>
          </section>

          <section className={card}>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><KeyRound className="h-5 w-5 text-acc"/>{t("settings.password")}</h2>
            <div className="mt-5"><ChangePassword/></div>
          </section>

          <section className={card}>
            <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><Clock3 className="h-5 w-5 text-teal"/>{t("settings.continue")}</h2><Link href="/history" className="text-sm font-medium text-acc">{t("nav.history")}</Link></div>
            <div className="mt-4 space-y-2">{recent.length===0?<p className="text-sm text-mut2">{t("settings.nothingYet")}</p>:recent.map(item=><Link key={item.type+item.href} href={item.href} className="block rounded-2xl border border-line bg-card p-4 transition hover:bg-chip">
              <div className="flex items-center justify-between gap-3"><span className="truncate font-medium">{item.title}</span><span className="shrink-0 text-xs text-mut2">{item.percent}%</span></div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-chip"><div className="h-full rounded-full bg-gradient-to-r from-sun to-coral" style={{width:Math.max(3,item.percent)+"%"}}/></div>
            </Link>)}</div>
          </section>

          <section className={card}>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Bookmark className="h-5 w-5 text-purple"/>{t("settings.saved")}</h2>
            <div className="mt-4 space-y-2">{bookmarks.length===0?<p className="text-sm text-mut2">{t("settings.nothingSaved")}</p>:bookmarks.slice(0,8).map(item=>{
              const target=item.work?{href:bookHref(item.work.slug),title:item.work.title,kind:t("common.book")}:item.story?{href:"/stories/"+item.story.slug,title:item.story.title,kind:t("common.story")}:null;
              return target&&<Link key={item.id} href={target.href} className="flex items-center justify-between gap-3 rounded-2xl border border-line p-4 transition hover:bg-chip"><span className="truncate">{target.title}</span><span className="shrink-0 text-xs text-mut2">{target.kind}</span></Link>;
            })}</div>
          </section>
        </div>

        <button onClick={logout} className="mt-6 inline-flex items-center gap-2 rounded-full border border-coral/30 px-5 py-3 text-sm font-medium text-coral transition hover:bg-coral/10"><LogOut className="h-4 w-4"/>{t("settings.logout")}</button>
      </>}
    </section>
    <SiteFooter/>
  </main>;
}
