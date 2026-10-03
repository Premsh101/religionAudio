"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, History, Play } from "lucide-react";
import AppHeader from "../../components/AppHeader";
import { clearHistory, getHistory } from "../../lib/client/history";
import { iconFor } from "../../components/home/ItemCard";
import type { FeedItem } from "../../lib/server/recommendations";

type Row=FeedItem&{progressPercent:number;completed:boolean;updatedAt:string};

function groupLabel(iso:string){
  const days=(Date.now()-new Date(iso).getTime())/86400000;
  if(days<1)return "Today";
  if(days<7)return "This week";
  if(days<31)return "This month";
  return "Earlier";
}

export default function HistoryPage(){
  const [rows,setRows]=useState<Row[]|null>(null);
  const [signedIn,setSignedIn]=useState(false);

  async function load(){
    const history=getHistory().map(({kind,id,progressPercent,completed,updatedAt,passageSequence})=>({kind,id,progressPercent,completed,updatedAt,passageSequence}));
    try{
      const res=await fetch("/api/user/history",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({history})});
      const data=res.ok?await res.json():{items:[],signedIn:false};
      setRows(data.items);setSignedIn(Boolean(data.signedIn));
    }catch{setRows([])}
  }
  useEffect(()=>{void load()},[]);

  const groups=(rows||[]).reduce<Record<string,Row[]>>((acc,row)=>{(acc[groupLabel(row.updatedAt)]??=[]).push(row);return acc},{});

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <section className="mx-auto max-w-4xl px-5 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="flex items-center gap-2 text-sm text-amber-300"><History className="h-4 w-4"/>Your history</p><h1 className="mt-2 font-display text-4xl">Listened &amp; read</h1></div>
        {rows&&rows.length>0&&<button onClick={()=>{clearHistory();void load()}} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:text-white">Clear this browser's history</button>}
      </div>
      {!signedIn&&<p className="mt-4 text-sm text-zinc-500">This history is saved in this browser. <Link href="/signup" className="text-zinc-300 underline">Create an account</Link> to keep it on every device.</p>}
      {rows===null?<p className="mt-10 text-sm text-zinc-500">Loading…</p>:
       rows.length===0?<div className="glass mt-10 rounded-3xl p-8"><p className="text-zinc-400">Nothing here yet. Stories and books you open or listen to will appear here, with a button to resume.</p><Link href="/stories" className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black">Find a story</Link></div>:
       <div className="mt-10 space-y-10">{Object.entries(groups).map(([label,list])=><div key={label}>
         <h2 className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-600">{label}</h2>
         <ul className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">{list.map(row=><li key={row.kind+row.id}>
           <Link href={row.href} className="flex items-center gap-4 p-4 hover:bg-white/[0.03]">
             <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-zinc-300">{iconFor(row,"h-5 w-5")}</span>
             <span className="min-w-0 flex-1"><span className="block truncate font-medium text-white">{row.title}</span><span className="mt-1 block text-xs text-zinc-500">{row.tag} · {new Date(row.updatedAt).toLocaleString()}</span>
               {!row.completed&&row.progressPercent>0&&<span className="mt-2 block h-1 max-w-xs overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-amber-300" style={{width:row.progressPercent+"%"}}/></span>}
             </span>
             {row.completed?<span className="flex items-center gap-1 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4"/>Finished</span>:<span className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300"><Play className="h-3.5 w-3.5"/>{row.progressPercent>0?"Resume":"Open"}</span>}
           </Link>
         </li>)}</ul>
       </div>)}</div>}
    </section>
  </main>;
}
