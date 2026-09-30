"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import AppHeader from "../../components/AppHeader";

export default function AIPage(){
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [loading,setLoading]=useState(false);

  async function ask(){
    if(!question.trim()) return;
    setLoading(true);setAnswer("");
    try{
      const res=await fetch("/api/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question})});
      const data=await res.json();
      setAnswer(data.answer || data.error || "No answer returned.");
    }catch{
      setAnswer("AI service is not configured yet.");
    }finally{setLoading(false)}
  }

  return <main className="min-h-screen bg-zinc-950">
      <AppHeader/>
    <section className="mx-auto max-w-5xl px-5 pb-20 pt-10">
      <div className="glass rounded-[32px] p-7 md:p-10">
        <p className="text-sm text-violet-300">Evidence-aware AI</p>
        <h1 className="mt-2 font-display text-5xl">Ask. Then see which lens answered.</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">The production AI layer will retrieve the exact source passages first, then separate textual, traditional, scholarly and scientific context.</p>
        <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Example: What does the Dhammapada say about hatred?" className="mt-8 min-h-36 w-full rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"/>
        <button onClick={ask} disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"><Sparkles className="h-4 w-4"/>{loading?"Thinking…":"Ask AI"}</button>
        {answer && <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6"><div className="text-xs uppercase tracking-[0.16em] text-violet-300">Response</div><div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{answer}</div></div>}
      </div>
    </section>
  </main>
}
