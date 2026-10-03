"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Compass, History, Home, Library, LogOut, MapPin, Mic, Moon, Search, Settings, Shield, Sun, UserRound } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import SunaveLogo from "./SunaveLogo";
import { isStaffRole, useApp } from "./AppProvider";

export function Logo({size=32}:{size?:number}){
  return <Link href="/" aria-label="Sunave home" className="flex shrink-0"><SunaveLogo size={size}/></Link>;
}

async function logout(){await fetch("/api/auth/logout",{method:"POST"});window.location.href="/"}

function useDismiss(open:boolean,close:()=>void){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!open)return;
    const onDown=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))close()};
    const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")close()};
    document.addEventListener("mousedown",onDown);document.addEventListener("keydown",onKey);
    return()=>{document.removeEventListener("mousedown",onDown);document.removeEventListener("keydown",onKey)};
  },[open,close]);
  return ref;
}

export function ThemeToggle(){
  const {theme,toggleTheme,t}=useApp();
  return <button type="button" onClick={toggleTheme} aria-label={t("nav.theme")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-chip text-ink transition hover:border-line2">
    {theme==="dark"?<Sun className="h-[18px] w-[18px]"/>:<Moon className="h-[18px] w-[18px]"/>}
  </button>;
}

function UserMenu(){
  const {user,t}=useApp();
  const [open,setOpen]=useState(false);
  const ref=useDismiss(open,()=>setOpen(false));
  if(!user)return null;
  const name=user.displayName||user.email||user.phone||"";
  const item="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-mut transition hover:bg-chip hover:text-ink";
  return <div ref={ref} className="relative">
    <button type="button" onClick={()=>setOpen(v=>!v)} aria-haspopup="menu" aria-expanded={open} aria-label={t("nav.me")} className="flex h-11 w-11 items-center justify-center rounded-full text-base font-extrabold uppercase text-white" style={{background:"linear-gradient(135deg,#B061FF,#FF4FA3)"}}>{name[0]||"U"}</button>
    {open&&<div role="menu" className="absolute end-0 top-14 z-50 w-64 rounded-2xl border border-line2 bg-card p-1.5 shadow-card">
      <div className="px-3 py-3"><p className="truncate text-sm font-extrabold text-ink">{user.displayName||t("nav.me")}</p><p className="truncate text-xs text-mut2" dir="ltr">{user.email||user.phone}</p></div>
      <div className="my-1 h-px bg-line"/>
      <Link role="menuitem" href="/history" className={item}><History className="h-4 w-4"/>{t("nav.history")}</Link>
      <Link role="menuitem" href="/account" className={item}><Settings className="h-4 w-4"/>{t("nav.settings")}</Link>
      {isStaffRole(user.role)&&<><div className="my-1 h-px bg-line"/><p className="eyebrow px-3 pb-1 pt-2 text-[10px] text-mut2">{t("nav.adminTools")}</p>
        <Link role="menuitem" href="/admin/review" className={item}><Shield className="h-4 w-4"/>{t("nav.studio")}</Link>
        <Link role="menuitem" href="/tts" className={item}><Mic className="h-4 w-4"/>{t("nav.narration")}</Link>
        <Link role="menuitem" href="/ai" className={item}><Bot className="h-4 w-4"/>{t("nav.askAi")}</Link>
        <Link role="menuitem" href="/places" className={item}><MapPin className="h-4 w-4"/>{t("nav.places")}</Link></>}
      <div className="my-1 h-px bg-line"/>
      <button role="menuitem" onClick={logout} className={item+" w-full text-coral hover:text-coral"}><LogOut className="h-4 w-4"/>{t("nav.logout")}</button>
    </div>}
  </div>;
}

function SearchPill(){
  const {t}=useApp();
  const router=useRouter();
  const [q,setQ]=useState("");
  return <form role="search" onSubmit={e=>{e.preventDefault();router.push("/search"+(q.trim()?"?q="+encodeURIComponent(q.trim()):""))}} className="hidden h-11 w-[300px] items-center gap-2 rounded-full border border-line bg-chip px-4 min-[1140px]:flex">
    <Search className="h-4 w-4 shrink-0 text-mut2"/>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t("nav.searchPh")} aria-label={t("nav.search")} className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-mut2"/>
  </form>;
}

export default function AppHeader(){
  const {user,t}=useApp();
  const path=usePathname()||"/";
  const active=(href:string)=>href==="/"?path==="/":path.startsWith(href);
  const browseActive=path.startsWith("/stories");
  const libraryActive=path.startsWith("/library")||path.startsWith("/read");
  const links:[string,string,boolean][]=[[t("nav.home"),"/",path==="/"],[t("nav.browse"),"/stories",browseActive],[t("nav.library"),"/library",libraryActive]];
  const tabs=[
    {href:"/",label:t("nav.home"),icon:Home,on:path==="/"},
    {href:"/stories",label:t("nav.browse"),icon:Compass,on:browseActive},
    {href:"/search",label:t("nav.search"),icon:Search,on:active("/search")},
    {href:"/library",label:t("nav.library"),icon:Library,on:libraryActive},
    {href:user?"/account":"/login",label:user?t("nav.me"):t("nav.login"),icon:UserRound,on:active("/account")||active("/history")||active("/login")},
  ];
  return <>
    <header className="sticky top-0 z-40 border-b border-line bg-nav backdrop-blur-[16px] backdrop-saturate-[1.7]">
      <div className="container-site flex h-[62px] items-center gap-7 min-[760px]:h-[76px]">
        <Logo/>
        <nav className="hidden gap-1 min-[760px]:flex">{links.map(([label,href,on])=><Link key={href} href={href} className={"rounded-full px-4 py-2.5 text-sm font-bold transition "+(on?"bg-chip text-ink":"text-mut hover:text-ink")}>{label}</Link>)}</nav>
        <div className="flex-1"/>
        <div className="flex items-center gap-2 min-[760px]:gap-2.5">
          <SearchPill/>
          <Link href="/search" aria-label={t("nav.search")} className="hidden h-11 w-11 items-center justify-center rounded-full border border-line bg-chip text-ink min-[760px]:flex min-[1140px]:hidden"><Search className="h-[18px] w-[18px]"/></Link>
          <LanguageSwitcher compact/>
          <ThemeToggle/>
          {user?<UserMenu/>:<>
            <Link href="/login" className="hidden px-3 py-2 text-sm font-bold text-ink min-[760px]:block">{t("nav.login")}</Link>
            <Link href="/signup" className="btn-primary hidden !px-5 !py-3 !text-sm min-[480px]:inline-flex">{t("nav.startFree")}</Link>
          </>}
        </div>
      </div>
    </header>
    <nav aria-label={t("nav.menu")} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-nav pb-[env(safe-area-inset-bottom)] backdrop-blur-[16px] min-[760px]:hidden">
      <div className="grid grid-cols-5">{tabs.map(({href,label,icon:Icon,on})=><Link key={label} href={href} className={"flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold "+(on?"text-acc":"text-mut2")}><Icon className="h-[22px] w-[22px]"/><span className="max-w-full truncate px-1">{label}</span></Link>)}</div>
    </nav>
  </>;
}
