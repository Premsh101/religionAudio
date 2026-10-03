"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, FlaskConical, GraduationCap, ScrollText, Sparkles } from "lucide-react";
import AppHeader from "../../components/AppHeader";

type Citation={lens:string;reference:string;source:string;url?:string;translator?:string};

export default function AIPage(){
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [citations,setCitations]=useState<Citation[]>([]);
  const [context,setContext]=useState("");
  const [loading,setLoading]=useState(false);

  async function ask(){
    if(!question.trim()) return;
    setLoading(true);setAnswer("");setCitations([]);setContext("");
    try{
      const res=await fetch("/api/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question})});
      const data=await res.json();
      setAnswer(data.answer || data.error || "No answer returned.");
      setCitations(data.citations||[]);setContext(data.context||"");
    }catch{setAnswer("AI service is not configured yet.");}
    finally{setLoading(false)}
  }

  const lenses=[
    ["TEXT","Text","What the indexed religious text actually says.",ScrollText],
    ["TRADITION","Tradition","How named traditions and commentators interpret it.",BookOpen],
    ["SCHOLARSHIP","Scholarship","Historical, textual and archaeological context.",GraduationCap],
    ["SCIENCE","Science","Empirical explanations, evidence and uncertainty.",FlaskConical]
  ] as const;

  return <main data-theme="dark" className="min-h-screen">
    <AppHeader/>
    <section className="mx-auto max-w-5xl px-5 pb-20 pt-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4"/>Home</Link>
      <div className="mt-7 glass rounded-[32px] p-7 md:p-10">
        <p className="text-sm text-violet-300">Evidence-aware AI</p>
        <h1 className="mt-2 font-display text-5xl">Ask about a belief. See the evidence layers.</h1>
        <p className="mt-4 max-w-3xl text-zinc-400">ReligionAudio does not ask AI to decide what is true. It separates the text, tradition, scholarship and scientific evidence so readers can understand the difference.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{lenses.map(([id,title,desc,Icon])=><div key={id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"><Icon className="h-4 w-4 text-zinc-400"/><div className="mt-3 text-sm font-medium">{title}</div><div className="mt-1 text-xs leading-5 text-zinc-600">{desc}</div></div>)}</div>
        <textarea value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")ask()}} placeholder="Example: What does the Dhammapada say about hatred, and how can psychology explain the same behaviour?" className="mt-8 min-h-36 w-full rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"/>
        <button onClick={ask} disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"><Sparkles className="h-4 w-4"/>{loading?"Researching…":"Ask AI"}</button>

        {answer&&<div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6"><div className="text-xs uppercase tracking-[0.16em] text-violet-300">Answer</div><div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{answer}</div></div>
          {citations.length>0&&<div className="rounded-2xl border border-white/10 bg-black/20 p-6"><div className="text-xs uppercase tracking-[0.16em] text-emerald-300">Retrieved sources</div><div className="mt-4 space-y-3">{citations.map((c,i)=><div key={i} className="rounded-xl border border-white/5 p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400">{c.lens}</span><span className="text-xs text-zinc-300">{c.reference}</span></div><div className="mt-2 text-xs text-zinc-500">{c.source}{c.translator?" · "+c.translator:""}</div>{c.url&&<a href={c.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-zinc-400 hover:text-white">Open source →</a>}</div>)}</div></div>}
          {context&&<details className="rounded-2xl border border-white/5 bg-black/10 p-5"><summary className="cursor-pointer text-xs uppercase tracking-[0.16em] text-zinc-600">Show retrieved text context</summary><pre className="mt-4 whitespace-pre-wrap text-xs leading-6 text-zinc-600">{context}</pre></details>}
        </div>}
      </div>
    </section>
  </main>
}
