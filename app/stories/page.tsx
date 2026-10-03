"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Baby, BookOpen, ChevronRight, Ghost, Heart, MapPin, Sparkles } from "lucide-react";
import AppHeader from "../../components/AppHeader";

const categories=[
  {id:"kids",title:"Little Wonderers",body:"Short, warm stories with simple language and a gentle question at the end.",icon:<Baby className="h-5 w-5"/>,tone:"from-emerald-500/25 to-teal-500/5"},
  {id:"mythology",title:"Myths & Legends",body:"Gods, heroes, tricksters, epic journeys and the many ways traditions tell them.",icon:<Sparkles className="h-5 w-5"/>,tone:"from-amber-500/25 to-orange-500/5"},
  {id:"folklore",title:"Stories from Home",body:"Village tales, local legends and regional stories collected with their place and tradition.",icon:<MapPin className="h-5 w-5"/>,tone:"from-cyan-500/25 to-sky-500/5"},
  {id:"ghost",title:"After Dark",body:"Ghost stories and supernatural folklore, clearly labelled as stories and beliefs.",icon:<Ghost className="h-5 w-5"/>,tone:"from-fuchsia-500/25 to-violet-500/5"},
  {id:"moral-tale",title:"Stories with a Lesson",body:"Timeless moral tales for children, parents and classrooms.",icon:<Heart className="h-5 w-5"/>,tone:"from-rose-500/25 to-pink-500/5"},
  {id:"sacred-text",title:"Stories Behind Scripture",body:"Narrative introductions to sacred texts before you dive into full reading.",icon:<BookOpen className="h-5 w-5"/>,tone:"from-violet-500/25 to-indigo-500/5"}
];

export default function StoriesPage(){
 const [active,setActive]=useState("all");
 const [published,setPublished]=useState<any[]>([]);
 useEffect(()=>{fetch("/api/stories").then(r=>r.ok?r.json():{stories:[]}).then(data=>setPublished(data.stories||[])).catch(()=>{});},[]);
 const shown=useMemo(()=>active==="all"?categories:categories.filter(c=>c.id===active),[active]);
 return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
  <section className="mx-auto max-w-6xl px-5 pb-20 pt-8">
   <p className="text-sm text-amber-300">Choose your mood</p>
   <h1 className="mt-2 max-w-3xl font-display text-5xl">Some nights need a scripture. Some need a story.</h1>
   <p className="mt-4 max-w-2xl text-zinc-400">ReligionAudio connects sacred texts with mythology, local folklore and family storytelling without pretending every kind of story is the same kind of evidence.</p>
   <div className="scrollbar-hide mt-8 flex gap-2 overflow-x-auto pb-2">{["all",...categories.map(c=>c.id)].map(id=><button key={id} onClick={()=>setActive(id)} className={`rounded-full border px-4 py-2 text-sm capitalize ${active===id?"border-white/20 bg-white text-black":"border-white/10 bg-white/5 text-zinc-400"}`}>{id==="all"?"Everything":id.replace("-", " ")}</button>)}</div>
   <div className="mt-8 grid gap-5 md:grid-cols-2">{shown.map(c=><Link href={`/?story=${c.id}`} key={c.id} className={`glass rounded-3xl bg-gradient-to-br ${c.tone} p-7 transition hover:-translate-y-1`}><div className="flex items-center justify-between"><span className="rounded-2xl bg-black/20 p-3">{c.icon}</span><ChevronRight className="h-5 w-5 text-zinc-600"/></div><h2 className="mt-10 font-display text-3xl">{c.title}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">{c.body}</p><div className="mt-6 text-xs text-zinc-600">Explore stories →</div></Link>)}</div>
   {published.length>0&&<section className="mt-12">
    <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-sm text-emerald-300">Published</p><h2 className="mt-1 font-display text-3xl">Stories from the editorial library.</h2></div><span className="text-xs text-zinc-600">{published.length} available</span></div>
    <div className="grid gap-5 md:grid-cols-2">
      {published.filter(story=>active==="all" || story.type.toLowerCase().includes(active.replace("-","_")) || story.audience.toLowerCase()===active.toLowerCase()).map(story=><Link key={story.slug} href={"/stories/"+story.slug} className="glass rounded-3xl p-6 transition hover:-translate-y-1">
        <div className="flex items-center justify-between gap-3"><span className="text-xs uppercase tracking-[0.16em] text-amber-300">{story.type.replaceAll("_"," ")}</span><span className="text-xs text-zinc-600">{story.audience}</span></div>
        <h3 className="mt-5 font-display text-2xl">{story.title}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{story.summary||"Open this published story."}</p>
        <div className="mt-5 text-xs text-zinc-600">{story.source?.name||"Editorial source"} · Open story →</div>
      </Link>)}
    </div>
   </section>}

   <Link href="/stories/adult" className="mt-12 flex items-center justify-between gap-4 rounded-3xl border border-rose-300/15 bg-rose-300/[0.03] p-6 hover:border-rose-300/30">
    <div><div className="flex items-center gap-2"><span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">18+</span><span className="font-display text-xl">Stories for adults</span></div><p className="mt-2 text-sm text-zinc-500">Mature romance from classic literature and history. You'll be asked to confirm you are 18 or older.</p></div>
    <span className="shrink-0 text-sm text-zinc-400">Enter →</span>
   </Link>
  </section>
 </main>
}