"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AudioLines, Check, ImagePlus, Loader2, RefreshCw, ShieldCheck, Sparkles, Undo2, Wand2 } from "lucide-react";
import AppHeader from "../../../components/AppHeader";
import CoverArt from "../../../components/CoverArt";

type Status="DRAFT"|"REVIEW"|"PUBLISHED"|"ARCHIVED";
type Item={kind:"story"|"work";id:string;slug:string;title:string;subtitle:string;tag:string;audience:string;language:string;status:Status;href:string;coverUrl:string|null;coverUpdatedAt:string|null;updatedAt:string;needsTitle:boolean;passages?:number;mature?:boolean;collection?:string|null;languages?:string[];audio:AudioCell[]};
type AudioCell={language:string;voice:string;status:"READY"|"QUEUED"|"PROCESSING"|"FAILED"|"NONE";done:number;total:number;assetId:string|null};
type Queue={queued:number;processing:number;failedJobs:number};

const LANG:Record<string,string>={en:"English",hi:"हिन्दी"};
const cellBusy=(c:AudioCell)=>c.status==="QUEUED"||c.status==="PROCESSING";
const CELL_STYLE:Record<AudioCell["status"],string>={READY:"border-emerald-400/30 bg-emerald-400/10 text-emerald-200",QUEUED:"border-sky-400/30 bg-sky-400/10 text-sky-200",PROCESSING:"border-amber-300/30 bg-amber-300/10 text-amber-100",FAILED:"border-rose-400/30 bg-rose-400/10 text-rose-200",NONE:"border-white/10 bg-white/[0.02] text-zinc-400"};

function cellLabel(c:AudioCell){
  if(c.status==="READY")return "Ready";
  if(c.status==="PROCESSING")return `Generating ${c.done}/${c.total||"…"}`;
  if(c.status==="QUEUED")return c.done?`Generating ${c.done}/${c.total}`:"In queue";
  if(c.status==="FAILED")return "Failed";
  return "Not generated";
}

const FILTERS=[["queue","Needs review"],["PUBLISHED","Live"],["noaudio","Missing audio"],["all","Everything"]] as const;
const statusStyle:Record<Status,string>={DRAFT:"bg-zinc-700/40 text-zinc-300",REVIEW:"bg-amber-300/15 text-amber-200",PUBLISHED:"bg-emerald-400/15 text-emerald-300",ARCHIVED:"bg-zinc-800 text-zinc-500"};

function Row({item,aiConfigured,imageConfigured,onChange}:{item:Item;aiConfigured:boolean;imageConfigured:boolean;onChange:(patch:Partial<Item>)=>void}){
  const [busy,setBusy]=useState<""|"approve"|"status"|"title"|"cover"|"audio">("");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
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
  const generateAudio=async(language?:string,voice?:string)=>{const d=await call("audio",base+"/audio",{method:"POST",body:JSON.stringify({language,voice})});if(d){onChange({audio:d.audio});setNotice(d.queued?`Queued ${d.queued} narration${d.queued===1?"":"s"}. They're generated one part at a time; this page updates by itself.`:"Everything here is already generated or in the queue.")}};
  const cover=async()=>{setNotice("");const d=await call("cover",base+"/cover",{method:"POST",body:JSON.stringify({direction})});if(d){onChange({coverUrl:d.coverUrl,coverUpdatedAt:new Date().toISOString()});setNotice(d.warning||(d.moment?`Cover shows: ${d.moment}`:""))}};

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
            <button onClick={cover} disabled={!imageConfigured||!!busy} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40">{busy==="cover"?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:item.coverUrl?<RefreshCw className="h-3.5 w-3.5"/>:<ImagePlus className="h-3.5 w-3.5"/>}{busy==="cover"?"Painting… (up to a minute)":item.coverUrl?"Regenerate cover":"Generate cover"}</button></div>
          <input id={"direction-"+item.id} value={direction} onChange={e=>setDirection(e.target.value)} placeholder="Optional art direction, e.g. “moonlit banyan tree, watercolour”" className="mt-3 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600"/>
        </div>
      </div>
      <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-zinc-500"><AudioLines className="h-3.5 w-3.5"/>Narration</p>
          {item.audio.some(c=>c.status==="NONE"||c.status==="FAILED")&&<button onClick={()=>generateAudio()} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40">{busy==="audio"?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<AudioLines className="h-3.5 w-3.5"/>}Generate all audio</button>}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{item.audio.map(c=><div key={c.language+c.voice} className={"rounded-xl border px-3 py-2 "+CELL_STYLE[c.status]}>
          <div className="flex items-center justify-between gap-2 text-xs"><span className="font-semibold">{LANG[c.language]||c.language} · {c.voice==="female"?"Female":"Male"}</span>{(c.status==="NONE"||c.status==="FAILED")&&<button onClick={()=>generateAudio(c.language,c.voice)} disabled={!!busy} className="rounded-lg border border-current/20 px-2 py-0.5 text-[11px] hover:bg-white/10 disabled:opacity-40">{c.status==="FAILED"?"Retry":"Generate"}</button>}</div>
          <div className="mt-1 flex items-center gap-2 text-[11px] opacity-80">{cellBusy(c)&&<Loader2 className="h-3 w-3 animate-spin"/>}{cellLabel(c)}</div>
          {cellBusy(c)&&c.total>0&&<div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-current" style={{width:`${Math.max(4,c.done/c.total*100)}%`}}/></div>}
        </div>)}</div>
        {item.kind==="story"&&<p className="mt-2 text-[11px] text-zinc-600">Hindi appears when the story has a Hindi text. Arabic and Urdu readers hear the English narration until those voices are added.</p>}
      </div>
      {error&&<p className="text-sm text-amber-200">{error}</p>}
      {notice&&!error&&<p className="text-sm text-zinc-400">{notice}</p>}
    </div>
  </li>;
}

export default function ReviewDashboard(){
  const [role,setRole]=useState<string|null|undefined>(undefined);
  const [items,setItems]=useState<Item[]>([]);
  const [aiConfigured,setAiConfigured]=useState(false);
  const [imageConfigured,setImageConfigured]=useState(false);
  const [filter,setFilter]=useState<(typeof FILTERS)[number][0]>("queue");
  const [queue,setQueue]=useState<Queue|null>(null);
  const [bulkBusy,setBulkBusy]=useState("");
  const [bulkNote,setBulkNote]=useState("");

  const refreshAudio=async()=>{
    const res=await fetch("/api/admin/audio",{cache:"no-store"});
    if(!res.ok)return;
    const d=await res.json() as {audio:Record<string,AudioCell[]>;queue:Queue};
    setQueue(d.queue);
    setItems(list=>list.map(i=>d.audio[i.kind+":"+i.id]?{...i,audio:d.audio[i.kind+":"+i.id]}:i));
  };
  const anyGenerating=items.some(i=>i.audio?.some(cellBusy))||Boolean(queue&&(queue.queued||queue.processing));
  // While anything is being generated, refresh the status every 10 seconds.
  useEffect(()=>{
    if(!anyGenerating)return;
    const timer=setInterval(()=>{void refreshAudio()},10000);
    return()=>clearInterval(timer);
  },[anyGenerating]);// eslint-disable-line react-hooks/exhaustive-deps

  async function bulk(scope:"published"|"review"|"all"){
    setBulkBusy(scope);setBulkNote("");
    try{
      const res=await fetch("/api/admin/audio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scope})});
      const d=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(d.error||"Could not queue narration.");
      setBulkNote(d.queued?`Queued ${d.queued} narrations across ${d.items} items${d.failed?` (${d.failed} items had no text to narrate)`:""}. Listeners who press Play always go ahead of this queue.`:`All ${d.items} items already have narration generated or queued.`);
      await refreshAudio();
    }catch(e){setBulkNote(e instanceof Error?e.message:"Could not queue narration.")}
    finally{setBulkBusy("")}
  }

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(async me=>{
      setRole(me.user?.role||null);
      if(me.user?.role!=="ADMIN"&&me.user?.role!=="EDITOR")return;
      const res=await fetch("/api/admin/catalog");
      if(res.ok){const d=await res.json();setItems(d.items);setAiConfigured(d.aiConfigured);setImageConfigured(Boolean(d.imageConfigured));void refreshAudio()}
    }).catch(()=>setRole(null));
  },[]);

  const visible=useMemo(()=>items.filter(i=>filter==="all"?true:filter==="queue"?i.status==="DRAFT"||i.status==="REVIEW":filter==="noaudio"?i.audio?.some(c=>c.status==="NONE"||c.status==="FAILED"):i.status==="PUBLISHED"),[items,filter]);
  const counts={queue:items.filter(i=>i.status==="DRAFT"||i.status==="REVIEW").length,live:items.filter(i=>i.status==="PUBLISHED").length,noCover:items.filter(i=>!i.coverUrl).length};
  const cells=items.flatMap(i=>i.audio||[]);
  const liveCells=items.filter(i=>i.status==="PUBLISHED").flatMap(i=>i.audio||[]);
  const audioCounts={ready:cells.filter(c=>c.status==="READY").length,total:cells.length,liveReady:liveCells.filter(c=>c.status==="READY").length,liveTotal:liveCells.length,failed:cells.filter(c=>c.status==="FAILED").length};
  const update=(it:Item,patch:Partial<Item>)=>setItems(list=>list.map(x=>x.kind===it.kind&&x.id===it.id?{...x,...patch}:x));

  if(role===undefined)return <main data-theme="dark" className="min-h-screen"><AppHeader/><p className="p-10 text-sm text-zinc-500">Loading…</p></main>;
  if(role!=="ADMIN"&&role!=="EDITOR")return <main data-theme="dark" className="min-h-screen"><AppHeader/><section className="mx-auto max-w-xl px-5 py-16"><div className="glass rounded-3xl p-8"><ShieldCheck className="h-6 w-6 text-amber-300"/><h1 className="mt-4 font-display text-3xl">Admins only</h1><p className="mt-2 text-sm text-zinc-500">Log in with an admin or editor account to review content.</p><Link href="/login?next=/admin/review" className="mt-6 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black">Log in</Link></div></section></main>;

  return <main data-theme="dark" className="min-h-screen">
    <AppHeader/>
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="flex items-center gap-2 text-sm text-amber-300"><Sparkles className="h-4 w-4"/>Studio</p><h1 className="mt-2 font-display text-4xl">Review, covers &amp; audio</h1></div>
        <Link href="/admin" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">Story editor</Link>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-zinc-500">Waiting for approval</p><p className="mt-1 font-display text-3xl tabular-nums">{counts.queue}</p></div>
        <div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-zinc-500">Live</p><p className="mt-1 font-display text-3xl tabular-nums">{counts.live}</p></div>
        <div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-zinc-500">Without a cover</p><p className="mt-1 font-display text-3xl tabular-nums">{counts.noCover}</p></div>
        <div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-zinc-500">Narrations ready (live items)</p><p className="mt-1 font-display text-3xl tabular-nums">{audioCounts.liveReady}<span className="text-lg text-zinc-500">/{audioCounts.liveTotal}</span></p></div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 font-semibold text-white"><AudioLines className="h-4 w-4 text-amber-300"/>Pre-generate narration</p>
            <p className="mt-1 text-sm text-zinc-400">Creates every missing narration (English, and Hindi where there's a Hindi text; female and male voices) so listeners hear it the moment they press Play. Parts are generated one after another by the audio worker.</p>
            <p className="mt-2 text-xs text-zinc-500">{audioCounts.ready} of {audioCounts.total} narrations ready{audioCounts.failed?` · ${audioCounts.failed} failed`:""}{queue?` · audio parts: ${queue.processing} generating now, ${queue.queued} waiting`:""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>bulk("published")} disabled={!!bulkBusy} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{bulkBusy==="published"&&<Loader2 className="h-4 w-4 animate-spin"/>}Generate for all live</button>
            <button onClick={()=>bulk("review")} disabled={!!bulkBusy} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50">{bulkBusy==="review"&&<Loader2 className="h-4 w-4 animate-spin"/>}…for items in review</button>
          </div>
        </div>
        {bulkNote&&<p className="mt-3 text-sm text-zinc-300">{bulkNote}</p>}
      </div>
      {!imageConfigured&&<p className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-4 text-sm text-amber-100">{aiConfigured?"Title suggestions work (via OpenRouter). Cover images need the Gemini key: add the Vertex AI service-account JSON to GOOGLE_VERTEX_CREDENTIALS_JSON in Coolify.":"Title and cover generation are off. Add a free OPENROUTER_API_KEY for titles, and the Vertex AI JSON (GOOGLE_VERTEX_CREDENTIALS_JSON) for covers, in Coolify. Approving and publishing still work."}</p>}
      <div className="mt-8 flex gap-2">{FILTERS.map(([key,label])=><button key={key} onClick={()=>setFilter(key)} className={"rounded-full border px-4 py-2 text-sm "+(filter===key?"border-white/20 bg-white text-black":"border-white/10 text-zinc-400")}>{label}</button>)}</div>
      {visible.length===0?<p className="mt-10 text-sm text-zinc-500">{filter==="queue"?"Nothing waiting for review.":"Nothing here."}</p>:
      <ul className="mt-6 space-y-4">{visible.map(item=><Row key={item.kind+item.id} item={item} aiConfigured={aiConfigured} imageConfigured={imageConfigured} onChange={patch=>update(item,patch)}/>)}</ul>}
    </section>
  </main>;
}
