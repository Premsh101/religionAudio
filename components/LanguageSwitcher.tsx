"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LOCALES, LOCALE_NAMES, LOCALE_SHORT } from "../lib/i18n/config";
import { setLocale, useApp } from "./AppProvider";

export default function LanguageSwitcher({compact}:{compact?:boolean}){
  const {locale,t}=useApp();
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!open)return;
    const close=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false)};
    const esc=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};
    document.addEventListener("mousedown",close);document.addEventListener("keydown",esc);
    return()=>{document.removeEventListener("mousedown",close);document.removeEventListener("keydown",esc)};
  },[open]);
  return <div ref={ref} className="relative">
    <button type="button" onClick={()=>setOpen(v=>!v)} aria-haspopup="menu" aria-expanded={open} aria-label={t("nav.language")} className="flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-200 transition hover:bg-white/10">
      <Globe className="h-4 w-4 text-amber-300"/>{compact?<span className="font-medium">{LOCALE_SHORT[locale]}</span>:<span>{LOCALE_NAMES[locale]}</span>}
    </button>
    {open&&<div role="menu" className="absolute end-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#16141f] p-1.5 shadow-2xl shadow-black/50">
      {LOCALES.map(l=><button key={l} role="menuitemradio" aria-checked={l===locale} lang={l} onClick={()=>{setOpen(false);if(l!==locale)setLocale(l)}} className={"flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-sm transition "+(l===locale?"bg-amber-300/10 text-amber-200":"text-zinc-300 hover:bg-white/5")}>
        <span>{LOCALE_NAMES[l]}</span>{l===locale&&<Check className="h-4 w-4"/>}
      </button>)}
    </div>}
  </div>;
}
