"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search as SearchIcon, Sparkles } from "lucide-react";
import AppHeader from "../../components/AppHeader";

type Result={
  query:string;
  works:Array<any>;
  passages:Array<any>;
  stories:Array<any>;
};

export default function SearchPage(){
  const [q,setQ]=useState("");
  const [loading,setLoading]=useState(false);
  const [results,setResults]=useState<Result>({query:"",works:[],passages:[],stories:[]});

  async function submit(e:FormEvent){
    e.preventDefault();
    if(q.trim().length<2) return;
    setLoading(true);
    try{
      const res=await fetch("/api/search?q="+encodeURIComponent(q.trim()));
      if(res.ok) setResults(await res.json());
    }finally{setLoading(false)}
  }

  const total=results.works.length+results.passages.length+results.stories.length;

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4"/>Home</Link>
      <div className="mt-7 rounded-[32px] border border-white/10 bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 p-7 md:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Library search</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Find a word, passage, book or story.</h1>
        <form onSubmit={submit} className="mt-7 flex max-w-3xl items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-2">
          <SearchIcon className="ml-3 h-5 w-5 text-zinc-600"/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Try creation, Buddha, Eden, moon, forgiveness…" className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-zinc-700"/>
          <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50" disabled={loading}>{loading?"Searching…":"Search"}</button>
        </form>
      </div>

      {results.query&&<div className="mt-8 text-sm text-zinc-500">{total} result{total===1?"":"s"} for <span className="text-zinc-300">“{results.query}”</span></div>}

      <div className="mt-4 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <section className="glass rounded-3xl p-6">
            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-300"/><h2 className="font-display text-2xl">Books</h2></div>
            <div className="mt-4 space-y-2">
              {results.works.map(work=><Link key={work.id} href={"/read/"+work.slug} className="block rounded-2xl border border-white/5 p-4 hover:bg-white/[0.04]"><div className="font-display">{work.title}</div><div className="mt-1 text-xs text-zinc-600">{work.edition||work.translator||work.language} · {work.source?.name||"ReligionAudio"}</div></Link>)}
              {!results.works.length&&<p className="text-sm text-zinc-600">No matching books.</p>}
            </div>
          </section>

          <section className="glass rounded-3xl p-6">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-300"/><h2 className="font-display text-2xl">Published stories</h2></div>
            <div className="mt-4 space-y-2">
              {results.stories.map(story=><Link key={story.slug} href={"/stories/"+story.slug} className="block rounded-2xl border border-white/5 p-4 hover:bg-white/[0.04]"><div className="font-display">{story.title}</div><div className="mt-1 text-xs text-zinc-600">{story.type.replaceAll("_"," ")} · {story.source?.name||"Editorial"}</div></Link>)}
              {!results.stories.length&&<p className="text-sm text-zinc-600">No matching published stories.</p>}
            </div>
          </section>
        </div>

        <section className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-zinc-600">Passages</p><h2 className="mt-2 font-display text-2xl">Text matches</h2></div><span className="text-xs text-zinc-600">{results.passages.length}</span></div>
          <div className="mt-5 space-y-3">
            {results.passages.map(p=><Link key={p.id} href={"/read/"+p.work.slug} className="block rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/10">
              <div className="flex items-center justify-between gap-3"><span className="text-xs uppercase tracking-[0.14em] text-amber-300">{p.work.title}</span><span className="text-xs text-zinc-600">{p.reference}</span></div>
              <p className="mt-3 font-display text-lg leading-8 text-zinc-200">{p.text}</p>
              <div className="mt-3 text-xs text-zinc-600">{p.work.source?.name||"ReligionAudio"}</div>
            </Link>)}
            {!results.passages.length&&<p className="rounded-2xl border border-white/5 p-5 text-sm text-zinc-600">Search a phrase to find matching passages across the local corpus.</p>}
          </div>
        </section>
      </div>
    </section>
  </main>
}
