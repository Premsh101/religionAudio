"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
 const shown=useMemo(()=>active==="all"?categories:categories.filter(c=>c.id===active),[active]);
 return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
  <section className="mx-auto max-w-6xl px-5 pb-20 pt-8">
   <p className="text-sm text-amber-300">Choose your mood</p>
   <h1 className="mt-2 max-w-3xl font-display text-5xl">Some nights need a scripture. Some need a story.</h1>
   <p className="mt-4 max-w-2xl text-zinc-400">ReligionAudio connects sacred texts with mythology, local folklore and family storytelling without pretending every kind of story is the same kind of evidence.</p>
   <div className="scrollbar-hide mt-8 flex gap-2 overflow-x-auto pb-2">{["all",...categories.map(c=>c.id)].map(id=><button key={id} onClick={()=>setActive(id)} className={`rounded-full border px-4 py-2 text-sm capitalize ${active===id?"border-white/20 bg-white text-black":"border-white/10 bg-white/5 text-zinc-400"}`}>{id==="all"?"Everything":id.replace("-", " ")}</button>)}</div>
   <div className="mt-8 grid gap-5 md:grid-cols-2">{shown.map(c=><Link href={`/?story=${c.id}`} key={c.id} className={`glass rounded-3xl bg-gradient-to-br ${c.tone} p-7 transition hover:-translate-y-1`}><div className="flex items-center justify-between"><span className="rounded-2xl bg-black/20 p-3">{c.icon}</span><ChevronRight className="h-5 w-5 text-zinc-600"/></div><h2 className="mt-10 font-display text-3xl">{c.title}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">{c.body}</p><div className="mt-6 text-xs text-zinc-600">Explore stories →</div></Link>)}</div>
  </section>
 </main>
}