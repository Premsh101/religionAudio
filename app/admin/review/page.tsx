"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ImagePlus, Loader2, RefreshCw, ShieldCheck, Sparkles, Undo2, Wand2 } from "lucide-react";
import AppHeader from "../../../components/AppHeader";
import CoverArt from "../../../components/CoverArt";

type Status="DRAFT"|"REVIEW"|"PUBLISHED"|"ARCHIVED";
type Item={kind:"story"|"work";id:string;slug:string;title:string;subtitle:string;tag:string;audience:string;language:string;status:Status;href:string;coverUrl:string|null;coverUpdatedAt:string|null;updatedAt:string;needsTitle:boolean;passages?:number;mature?:boolean;collection?:string|null;languages?:string[]};

const FILTERS=[["queue","Needs review"],["PUBLISHED","Live"],["all","Everything"]] as const;
const statusStyle:Record<Status,string>={DRAFT:"bg-zinc-700/40 text-zinc-300",REVIEW:"bg-amber-300/15 text-amber-200",PUBLISHED:"bg-emerald-400/15 text-emerald-300",ARCHIVED:"bg-zinc-800 text-zinc-500"};

function Row({item,aiConfigured,onChange}:{item:Item;aiConfigured:boolean;onChange:(patch:Partial<Item>)=>void}){
  const [busy,setBusy]=useState<""|"approve"|"status"|"title"|"cover">("");
  const [error,setError]=useState("");
  const [titles,setTitles]=useState<string[]|null>(null);
  const [summary,setSummary]=useState("");
  const [direction,setDirection]=useState("");
  const base=`/api/admin/catalog/${item.kind}/${item.id}`;

  async function call(kind:typeof busy,url:string,init:RequestInit){
    setBusy(kind);setError("");
    try{
      const res=await fetch(url,{headers:{"Content-Type":"application/json"},...init});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||"Something went wrong.");
      return data;
    }catch(e){setError(e instanceof Error?e.message:"Something went wrong.");return null}
    finally{setBusy("")}
  }
  const setStatus=async(status:Status)=>{const d=await call(status==="PUBLISHED"?"approve":"status",base,{method:"PATCH",body:JSON.stringify({status})});if(d)onChange({status:d.item.status})};
  const suggest=async()=>{const d=await call("title",base+"/title",{method:"POST"});if(d){setTitles(d.titles);setSummary(d.summary||"")}};
  const applyTitle=async(title:string)=>{const d=await call("title",base,{method:"PATCH",body:JSON.stringify({title,summary:summary||undefined})});if(d){onChange({title:d.item.title,subtitle:d.item.summary||item.subtitle,needsTitle:false});setTitles(null)}};
  const cover=async()=>{const d=await call("cover",base+"/cover",{method:"POST",body:JSON.stringify({direction})});if(d)onChange({coverUrl:d.coverUrl,coverUpdatedAt:new Date().toISOString()})};

  return <li className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:grid-cols-[150px_1fr]">
    <div className="w-[150px]"><CoverArt title={item.title} tag={item.tag} kind={item.kind} coverUrl={item.coverUrl} size="md"/></div>
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs"><span className={"rounded-full px-2.5 py-1 font-semibold "+statusStyle[item.status]}>{item.status==="REVIEW"?"In review":item.status.toLowerCase()}</span>{item.mature&&<span className="rounded-full bg-rose-500 px-2 py-1 font-bold text-white">18+</span>}{item.collection&&<span className="rounded-full border border-white/10 px-2 py-1 text-zinc-400">{item.collection}</span>}{item.languages&&item.languages.length>1&&<span className="text-zinc-500">{item.languages.join(" · ")}</span>}<span className="text-zinc-500">{item.kind==="work"?"Book":"Story"}{item.tag!=="story"?` · ${item.tag}`:""} · {item.audience} · {item.language}{item.passages?` · ${item.passages} passages`:""}</span></div>
          <h2 className="mt-2 font-display text-2xl text-white">{item.title}</h2>
          {item.needsTitle&&<p className="mt-1 text-xs text-amber-300">This title looks like a placeholder. Generate a real one.</p>}
          {item.subtitle&&<p className="mt-1 line-clamp-2 text-sm text-zinc-500">{item.subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={item.href} target="_blank" className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300">Preview</Link>
          {item.status!=="PUBLISHED"
            ?<button onClick={()=>setStatus("PUBLISHED")} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-black disabled:opacity-50">{busy==="approve"?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Check className="h-3.5 w-3.5"/>}Approve &amp; publish</button>
            :<button onClick={()=>setStatus("DRAFT")} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 disabled:opacity-50"><Undo2 className="h-3.5 w-3.5"/>Unpublish</button>}
          {item.kind==="story"&&<button onClick={async()=>{const d=await call("status",base,{method:"PATCH",body:JSON.stringify({mature:!item.mature})});if(d)onChange({mature:!item.mature})}} disabled={!!busy} className={"rounded-xl border px-3 py-2 text-xs disabled:opacity-50 "+(item.mature?"border-rose-300/40 text-rose-200":"border-white/10 text-zinc-300")}>{item.mature?"Remove 18+":"Mark 18+"}</button>}
          {item.status==="DRAFT"&&<button onClick={()=>setStatus("REVIEW")} disabled={!!busy} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 disabled:opacity-50">Mark for review</button>}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-2"><p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Title</p>
            <button onClick={suggest} disabled={!aiConfigured||!!busy} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-200 disabled:opacity-40">{busy==="title"?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Wand2 className="h-3.5 w-3.5"/>}{titles?"Suggest again":"Generate titles"}</button></div>
          {titles&&<div className="mt-3 space-y-2">
            {titles.map(t=><button key={t} onClick={()=>applyTitle(t)} disabled={!!busy} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm text-white hover:border-white/30">{t}</button>)}
            {summary&&<p className="text-xs text-zinc-500">Summary saved with the title: {summary}</p>}
          </div>}
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-2"><p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Cover</p>
            <button onClick={cover} disabled={!aiConfigured||!!busy} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40">{busy==="cover"?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:item.coverUrl?<RefreshCw className="h-3.5 w-3.5"/>:<ImagePlus className="h-3.5 w-3.5"/>}{busy==="cover"?"Painting… (up to a minute)":item.coverUrl?"Regenerate cover":"Generate cover"}</button></div>
          <input id={"direction-"+item.id} value={direction} onChange={e=>setDirection(e.target.value)} placeholder="Optional art direction, e.g. “moonlit banyan tree, watercolour”" className="mt-3 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600"/>
        </div>
      </div>
      {error&&<p className="text-sm text-amber-200">{error}</p>}
    </div>
  </li>;
}

export default function ReviewDashboard(){
  const [role,setRole]=useState<string|null|undefined>(undefined);
  const [items,setItems]=useState<Item[]>([]);
  const [aiConfigured,setAiConfigured]=useState(false);
  const [filter,setFilter]=useState<(typeof FILTERS)[number][0]>("queue");

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(async me=>{
      setRole(me.user?.role||null);
      if(me.user?.role!=="ADMIN"&&me.user?.role!=="EDITOR")return;
      const res=await fetch("/api/admin/catalog");
      if(res.ok){const d=await res.json();setItems(d.items);setAiConfigured(d.aiConfigured)}
    }).catch(()=>setRole(null));
  },[]);

  const visible=useMemo(()=>items.filter(i=>filter==="all"?true:filter==="queue"?i.status==="DRAFT"||i.status==="REVIEW":i.status==="PUBLISHED"),[items,filter]);
  const counts={queue:items.filter(i=>i.status==="DRAFT"||i.status==="REVIEW").length,live:items.filter(i=>i.status==="PUBLISHED").length,noCover:items.filter(i=>!i.coverUrl).length};
  const update=(it:Item,patch:Partial<Item>)=>setItems(list=>list.map(x=>x.kind===it.kind&&x.id===it.id?{...x,...patch}:x));

  if(role===undefined)return <main className="min-h-screen bg-zinc-950"><AppHeader/><p className="p-10 text-sm text-zinc-500">Loading…</p></main>;
  if(role!=="ADMIN"&&role!=="EDITOR")return <main className="min-h-screen bg-zinc-950"><AppHeader/><section className="mx-auto max-w-xl px-5 py-16"><div className="glass rounded-3xl p-8"><ShieldCheck className="h-6 w-6 text-amber-300"/><h1 className="mt-4 font-display text-3xl">Admins only</h1><p className="mt-2 text-sm text-zinc-500">Log in with an admin or editor account to review content.</p><Link href="/login?next=/admin/review" className="mt-6 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black">Log in</Link></div></section></main>;

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="flex items-center gap-2 text-sm text-amber-300"><Sparkles className="h-4 w-4"/>Studio</p><h1 className="mt-2 font-display text-4xl">Review &amp; covers</h1></div>
        <Link href="/admin" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">Story editor</Link>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-zinc-500">Waiting for approval</p><p className="mt-1 font-display text-3xl tabular-nums">{counts.queue}</p></div>
        <div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-zinc-500">Live</p><p className="mt-1 font-display text-3xl tabular-nums">{counts.live}</p></div>
        <div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-zinc-500">Without a cover</p><p className="mt-1 font-display text-3xl tabular-nums">{counts.noCover}</p></div>
      </div>
      {!aiConfigured&&<p className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-4 text-sm text-amber-100">Title and cover generation is off until the Vertex AI service-account JSON is added to <code>GOOGLE_VERTEX_CREDENTIALS_JSON</code> in Coolify. Approving and publishing still work.</p>}
      <div className="mt-8 flex gap-2">{FILTERS.map(([key,label])=><button key={key} onClick={()=>setFilter(key)} className={"rounded-full border px-4 py-2 text-sm "+(filter===key?"border-white/20 bg-white text-black":"border-white/10 text-zinc-400")}>{label}</button>)}</div>
      {visible.length===0?<p className="mt-10 text-sm text-zinc-500">{filter==="queue"?"Nothing waiting for review.":"Nothing here."}</p>:
      <ul className="mt-6 space-y-4">{visible.map(item=><Row key={item.kind+item.id} item={item} aiConfigured={aiConfigured} onChange={patch=>update(item,patch)}/>)}</ul>}
    </section>
  </main>;
}
