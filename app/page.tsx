"use client";

import { useMemo, useState, type ReactNode } from "react";
import AppHeader from "../components/AppHeader";
import { ArrowRight, Baby, BookOpen, Clock3, Ghost, Headphones, MapPin, Play, Search, Sparkles } from "lucide-react";

type Story={title:string;subtitle:string;tag:string;audience:string;duration:string;accent:string;icon:ReactNode;href:string};

const stories:Story[]=[
  {title:"The Night the Banyan Whispered",subtitle:"A village legend about a midnight voice, an old tree and one very brave child.",tag:"Local Folklore",audience:"Teens + Adults",duration:"12 min",accent:"from-violet-500/35 via-fuchsia-500/15 to-transparent",icon:<Ghost className="h-5 w-5"/>,href:"/stories/night-the-banyan-whispered"},
  {title:"Ganesha and the Moon",subtitle:"A playful mythology story made for curious young listeners.",tag:"Mythology",audience:"Kids",duration:"8 min",accent:"from-amber-500/35 via-orange-500/15 to-transparent",icon:<Sparkles className="h-5 w-5"/>,href:"/stories/ganesha-and-the-moon"},
  {title:"The First Sermon",subtitle:"A story-led introduction to Buddha's first teaching at Sarnath.",tag:"Sacred Story",audience:"Family",duration:"15 min",accent:"from-cyan-500/35 via-sky-500/15 to-transparent",icon:<BookOpen className="h-5 w-5"/>,href:"/stories/the-first-sermon"},
  {title:"The Honest Woodcutter",subtitle:"A classic moral tale with a question children can answer themselves.",tag:"Moral Tale",audience:"Kids 7–12",duration:"6 min",accent:"from-emerald-500/30 via-teal-500/15 to-transparent",icon:<Baby className="h-5 w-5"/>,href:"/stories/the-honest-woodcutter"}
];

const filters=["Everything","Kids","Family","Mythology","Folklore","Ghost Stories","Moral Tales"];

export default function HomePage(){
  const [filter,setFilter]=useState("Everything");
  const [query,setQuery]=useState("");
  const visible=useMemo(()=>{
    let list=stories;
    if(filter!=="Everything"){
      const normalized=filter.toLowerCase();
      list=list.filter(s=>s.tag.toLowerCase().includes(normalized) || s.audience.toLowerCase().includes(normalized));
    }
    if(query.trim()){
      const q=query.toLowerCase();
      list=list.filter(s=>(s.title+" "+s.subtitle+" "+s.tag).toLowerCase().includes(q));
    }
    return list;
  },[filter,query]);

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>

    <section className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
      <div className="rounded-[28px] border border-amber-300/10 bg-gradient-to-r from-amber-300/[0.08] via-white/[0.03] to-transparent px-5 py-3 text-center text-xs text-zinc-400">
        <span className="text-amber-200">New</span> · Story-first sacred learning for kids, families and adults — with source-aware AI.
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 pb-14 pt-5 md:px-8 md:pt-7">
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 p-7 md:p-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"/>
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl"/>
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300"><Sparkles className="h-3.5 w-3.5 text-amber-300"/>Listen to a story. Then explore where it came from.</div>
          <h1 className="mt-6 font-display text-4xl leading-[1.08] tracking-tight md:text-6xl">A living library of <span className="text-amber-300">sacred stories.</span></h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">Scripture when you want depth. Stories when you want wonder. Folklore when you want mystery. And an AI companion that keeps text, tradition, scholarship and science clearly separated.</p>
          <form action="/search" className="mt-7 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-2"><Search className="ml-3 h-5 w-5 text-zinc-600"/><input name="q" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Krishna, Buddha, ghost stories, Sarnath..." className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-zinc-700"/><button className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black">Search</button></form>
          <div className="mt-7 flex flex-wrap gap-2 text-xs text-zinc-500"><span className="rounded-full bg-white/5 px-3 py-1.5">Read & listen</span><span className="rounded-full bg-white/5 px-3 py-1.5">Kids mode</span><span className="rounded-full bg-white/5 px-3 py-1.5">Sacred places</span><span className="rounded-full bg-white/5 px-3 py-1.5">Evidence-aware AI</span></div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 pb-12 md:px-8">
      <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-sm text-amber-300">Tonight's picks</p><h2 className="mt-1 font-display text-3xl">Choose a story, not a chapter.</h2></div><a href="/stories" className="hidden items-center gap-1 text-sm text-zinc-500 hover:text-white sm:flex">See all <ArrowRight className="h-4 w-4"/></a></div>
      <div className="scrollbar-hide mb-6 flex gap-2 overflow-x-auto pb-2">{filters.map(item=><button key={item} onClick={()=>setFilter(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${filter===item?"border-white/20 bg-white text-black":"border-white/10 bg-white/5 text-zinc-400"}`}>{item}</button>)}</div>
      <div className="grid gap-5 lg:grid-cols-2">{visible.map(story=><article key={story.title} className={`story-card relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${story.accent} p-6`}><div className="flex items-start justify-between"><div className="flex items-center gap-2"><span className="rounded-2xl border border-white/10 bg-black/20 p-3">{story.icon}</span><span className="text-xs text-zinc-500">{story.tag}</span></div><span className="flex items-center gap-1.5 text-xs text-zinc-600"><Clock3 className="h-3.5 w-3.5"/>{story.duration}</span></div><h3 className="mt-8 font-display text-2xl md:text-3xl">{story.title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">{story.subtitle}</p><div className="mt-7 flex items-center justify-between"><span className="rounded-full bg-black/20 px-3 py-1 text-xs text-zinc-500">{story.audience}</span><a href={story.href} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"><Play className="h-4 w-4 fill-current"/>Open story</a></div></article>)}</div>
    </section>

    <section className="mx-auto max-w-7xl px-5 pb-12 md:px-8">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-7"><p className="text-sm text-emerald-300">For little wonderers</p><h2 className="mt-2 max-w-xl font-display text-3xl">Stories children can understand — without talking down to them.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Short episodes, gentle narration, age labels and a question at the end so parents and children can talk about what they heard.</p><a href="/stories" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black">Explore kids stories <ArrowRight className="h-4 w-4"/></a></div>
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 to-transparent p-7"><p className="text-sm text-fuchsia-300">After dark</p><h2 className="mt-2 font-display text-3xl">Local legends. Haunted places. Old stories.</h2><p className="mt-3 text-sm leading-6 text-zinc-500">Folklore and ghost stories stay labelled as stories and cultural beliefs, with their locations and sources.</p><a href="/stories" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300">Enter after dark <Ghost className="h-4 w-4"/></a></div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 pb-12 md:px-8">
      <div className="grid gap-5 md:grid-cols-3">
        <Feature title="Read + Listen" body="Synchronized reading, narration profiles, bookmarks and progress." href="/library" icon={<Headphones className="h-5 w-5"/>}/>
        <Feature title="Sacred Places" body="Find the city, shrine, monastery or pilgrimage route behind the story." href="/places" icon={<MapPin className="h-5 w-5"/>}/>
        <Feature title="Ask AI" body="Ask what the text says, how traditions interpret it and what evidence can establish." href="/ai" icon={<Sparkles className="h-5 w-5"/>}/>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
      <div className="rounded-3xl border border-violet-300/10 bg-violet-300/[0.04] p-7 md:p-10"><div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div className="max-w-2xl"><p className="text-sm text-violet-300">One platform. Four lenses.</p><h2 className="mt-2 font-display text-3xl">Faith is not flattened into a chatbot answer.</h2><p className="mt-3 text-sm leading-6 text-zinc-500">Primary text, tradition, scholarship and science are presented as distinct layers so users can explore questions without confusing belief with empirical evidence.</p></div><a href="/ai" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">Ask a question <Sparkles className="h-4 w-4"/></a></div></div>
    </section>

    <footer className="border-t border-white/5 px-5 py-8 text-center text-xs text-zinc-600">Sacred Stories · Read · Listen · Explore · Question</footer>
  </main>
}

function Feature({title,body,href,icon}:{title:string;body:string;href:string;icon:ReactNode}){
  return <a href={href} className="glass rounded-3xl p-6 transition hover:-translate-y-1 hover:border-white/15"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">{icon}</div><h3 className="mt-6 font-display text-2xl">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p><span className="mt-5 inline-flex items-center gap-1 text-xs text-zinc-600">Explore <ArrowRight className="h-3.5 w-3.5"/></span></a>
}