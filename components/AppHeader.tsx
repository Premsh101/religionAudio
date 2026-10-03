"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bot, ChevronDown, History, Home, Library, LogOut, MapPin, Mic, Search, Settings, Shield, Sparkles, UserRound } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { isStaffRole, useApp } from "./AppProvider";

export function Logo(){
  const {t}=useApp();
  return <Link href="/" className="flex shrink-0 items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-black shadow-lg shadow-orange-500/20"><Sparkles className="h-[18px] w-[18px]"/></span>
    <span className="font-display text-lg font-semibold leading-none tracking-tight text-white">{t("brand.name")}</span>
  </Link>;
}

async function logout(){await fetch("/api/auth/logout",{method:"POST"});window.location.href="/"}

function UserMenu(){
  const {user,t}=useApp();
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!open)return;
    const close=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false)};
    const esc=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};
    document.addEventListener("mousedown",close);document.addEventListener("keydown",esc);
    return()=>{document.removeEventListener("mousedown",close);document.removeEventListener("keydown",esc)};
  },[open]);
  if(!user)return null;
  const name=user.displayName||user.email||user.phone||"";
  const staff=isStaffRole(user.role);
  const item="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white";
  return <div ref={ref} className="relative">
    <button type="button" onClick={()=>setOpen(v=>!v)} aria-haspopup="menu" aria-expanded={open} className="flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] ps-1 pe-2.5 transition hover:bg-white/10">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 text-sm font-semibold uppercase text-white">{(name[0]||"U")}</span>
      <ChevronDown className="h-4 w-4 text-zinc-400"/>
    </button>
    {open&&<div role="menu" className="absolute end-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#16141f] p-1.5 shadow-2xl shadow-black/50">
      <div className="px-3 py-3"><p className="truncate text-sm font-medium text-white">{user.displayName||t("nav.me")}</p><p className="truncate text-xs text-zinc-500">{user.email||user.phone}</p></div>
      <div className="my-1 h-px bg-white/5"/>
      <Link role="menuitem" href="/history" className={item}><History className="h-4 w-4"/>{t("nav.history")}</Link>
      <Link role="menuitem" href="/account" className={item}><Settings className="h-4 w-4"/>{t("nav.settings")}</Link>
      {staff&&<><div className="my-1 h-px bg-white/5"/><p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">{t("nav.adminTools")}</p>
        <Link role="menuitem" href="/admin/review" className={item}><Shield className="h-4 w-4"/>{t("nav.studio")}</Link>
        <Link role="menuitem" href="/tts" className={item}><Mic className="h-4 w-4"/>{t("nav.narration")}</Link>
        <Link role="menuitem" href="/ai" className={item}><Bot className="h-4 w-4"/>{t("nav.askAi")}</Link>
        <Link role="menuitem" href="/places" className={item}><MapPin className="h-4 w-4"/>{t("nav.places")}</Link></>}
      <div className="my-1 h-px bg-white/5"/>
      <button role="menuitem" onClick={logout} className={item+" w-full text-rose-300 hover:text-rose-200"}><LogOut className="h-4 w-4"/>{t("nav.logout")}</button>
    </div>}
  </div>;
}

export default function AppHeader(){
  const {user,t}=useApp();
  const path=usePathname()||"/";
  const active=(href:string)=>href==="/"?path==="/":path.startsWith(href);
  const links:[string,string][]=[[t("nav.home"),"/"],[t("nav.stories"),"/stories"],[t("nav.library"),"/library"]];
  const tabs=[
    {href:"/",label:t("nav.home"),icon:Home},
    {href:"/stories",label:t("nav.stories"),icon:BookOpen},
    {href:"/search",label:t("nav.search"),icon:Search},
    {href:"/library",label:t("nav.library"),icon:Library},
    {href:user?"/account":"/login",label:user?t("nav.me"):t("nav.login"),icon:UserRound},
  ];
  return <>
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0b0a14]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Logo/>
          <nav className="hidden items-center gap-1 md:flex">{links.map(([label,href])=><Link key={href} href={href} className={"rounded-full px-4 py-2 text-sm font-medium transition "+(active(href)?"bg-white/10 text-white":"text-zinc-400 hover:text-white")}>{label}</Link>)}</nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/search" aria-label={t("nav.search")} className="hidden h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white md:flex"><Search className="h-5 w-5"/></Link>
          <LanguageSwitcher compact/>
          {user?<UserMenu/>:<>
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-200 hover:text-white sm:block">{t("nav.login")}</Link>
            <Link href="/signup" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-200">{t("nav.signup")}</Link>
          </>}
        </div>
      </div>
    </header>
    <nav aria-label={t("nav.menu")} className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#0b0a14]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">{tabs.map(({href,label,icon:Icon})=>{
        const on=active(href)||(href==="/account"&&path.startsWith("/history"));
        return <Link key={label} href={href} className={"flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium "+(on?"text-amber-300":"text-zinc-500")}><Icon className="h-5 w-5"/><span className="max-w-full truncate px-1">{label}</span></Link>;
      })}</div>
    </nav>
  </>;
}
