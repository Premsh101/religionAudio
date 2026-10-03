"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "./AppHeader";
import LanguageSwitcher from "./LanguageSwitcher";
import { useT } from "./AppProvider";
import { CATEGORY_STYLE, categoryGradient, categoryLabelKey, type CategoryKey } from "../lib/categories";

const ART:CategoryKey[]=["epics","festivals","children","adventure","sacred-places","ghost"];

/** Two-panel layout for login and signup: a friendly form on one side, colourful story art on the other. */
export default function AuthShell({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){
  const t=useT();
  return <main className="grid min-h-screen lg:grid-cols-2">
    <section className="flex flex-col px-5 py-6 md:px-10">
      <div className="flex items-center justify-between"><Logo/><LanguageSwitcher compact/></div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-zinc-400">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
    <aside className="relative hidden overflow-hidden bg-[#120f1f] lg:block" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_20%,rgba(245,158,11,.25),transparent_70%),radial-gradient(50%_50%_at_80%_80%,rgba(168,85,247,.3),transparent_70%)]"/>
      <div className="absolute inset-0 grid -rotate-6 scale-110 grid-cols-3 gap-4 p-10 opacity-90">
        {ART.map((key,i)=><div key={key} className={"float-slow flex aspect-[3/4] flex-col justify-end rounded-3xl p-4 ring-1 ring-white/10 "+(i%2?"mt-16":"")} style={{background:categoryGradient(key),animationDelay:`${i*0.8}s`}}>
          <span className="text-5xl">{CATEGORY_STYLE[key].emoji}</span>
          <span className="mt-3 font-semibold text-white drop-shadow">{t(categoryLabelKey(key))}</span>
        </div>)}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-12 pt-32">
        <p className="font-display text-3xl font-semibold text-white">{t("auth.sideTitle")}</p>
        <p className="mt-2 text-zinc-300">{t("auth.sideBody")}</p>
      </div>
    </aside>
  </main>;
}

export const inputClass="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/60 focus:bg-white/[0.06]";

export function Field({label,hint,children}:{label:string;hint?:string;children:React.ReactNode}){
  return <label className="block text-sm font-medium text-zinc-200">{label}{hint&&<span className="ms-1 font-normal text-zinc-500">({hint})</span>}{children}</label>;
}

export function PasswordInput({value,onChange,autoComplete,required=true,minLength}:{value:string;onChange:(v:string)=>void;autoComplete:string;required?:boolean;minLength?:number}){
  const t=useT();
  const [show,setShow]=useState(false);
  return <div className="relative">
    <input type={show?"text":"password"} required={required} minLength={minLength} maxLength={128} autoComplete={autoComplete} value={value} onChange={e=>onChange(e.target.value)} className={inputClass+" pe-12"} dir="ltr"/>
    <button type="button" onClick={()=>setShow(v=>!v)} className="absolute end-3 top-1/2 mt-1 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:text-white" aria-label={t("auth.showPw")} aria-pressed={show}>{show?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button>
  </div>;
}

export function FormError({message}:{message:string}){
  return message?<div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{message}</div>:null;
}

export const primaryButton="w-full rounded-full bg-amber-300 px-6 py-4 text-base font-semibold text-black transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60";
