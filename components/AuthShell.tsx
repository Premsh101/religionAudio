"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Logo, ThemeToggle } from "./AppHeader";
import { Cover } from "./StoryTile";
import LanguageSwitcher from "./LanguageSwitcher";
import { useT } from "./AppProvider";
import { categoryLabelKey, type CategoryKey } from "../lib/categories";

const ART:CategoryKey[]=["epics","ghost","children","adventure","romance","folklore","festivals","sacred-places","mythology"];

/** Two-panel layout for login and signup: the form on one side, a tilted collage of story art on the other. */
export default function AuthShell({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){
  const t=useT();
  return <main className="grid min-h-screen min-[900px]:grid-cols-2">
    <section className="flex flex-col px-[18px] py-6 min-[760px]:px-10">
      <div className="flex items-center justify-between gap-3"><Logo/><div className="flex items-center gap-2"><LanguageSwitcher compact/><ThemeToggle/></div></div>
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
        <h1 className="font-display text-[44px] leading-none tracking-[-.02em] min-[760px]:text-[52px]">{title}</h1>
        <p className="mt-3 text-mut">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
    <aside className="relative hidden overflow-hidden bg-bg2 min-[900px]:block" aria-hidden>
      <div className="absolute -inset-16 grid -rotate-[8deg] grid-cols-3 gap-6">
        {ART.map((key,i)=><div key={key} className={i%3===1?"translate-y-24":""}><Cover title={t(categoryLabelKey(key))} category={key} seed={key+"auth"} size="md"/></div>)}
      </div>
      <div className="absolute inset-0" style={{background:"linear-gradient(to top, rgba(9,7,20,.96) 0%, rgba(9,7,20,.55) 45%, rgba(9,7,20,.35) 100%)"}}/>
      <div className="absolute inset-x-0 bottom-0 p-12">
        <p className="font-display text-[44px] leading-none text-white">{t("auth.sideTitle")}</p>
        <p className="mt-3 max-w-md text-white/80">{t("auth.sideBody")}</p>
      </div>
    </aside>
  </main>;
}

export const inputClass="input mt-2";

export function Field({label,hint,children}:{label:string;hint?:string;children:React.ReactNode}){
  return <label className="block text-sm font-bold text-ink">{label}{hint&&<span className="ms-1 font-medium text-mut2">({hint})</span>}{children}</label>;
}

export function PasswordInput({value,onChange,autoComplete,required=true,minLength}:{value:string;onChange:(v:string)=>void;autoComplete:string;required?:boolean;minLength?:number}){
  const t=useT();
  const [show,setShow]=useState(false);
  return <div className="relative">
    <input type={show?"text":"password"} required={required} minLength={minLength} maxLength={128} autoComplete={autoComplete} value={value} onChange={e=>onChange(e.target.value)} className={inputClass+" pe-12"} dir="ltr"/>
    <button type="button" onClick={()=>setShow(v=>!v)} className="absolute end-3 top-1/2 mt-1 -translate-y-1/2 rounded-lg p-1.5 text-mut2 hover:text-ink" aria-label={t("auth.showPw")} aria-pressed={show}>{show?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button>
  </div>;
}

export function FormError({message}:{message:string}){
  return message?<div role="alert" className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">{message}</div>:null;
}

export const primaryButton="btn-primary w-full !py-4";
