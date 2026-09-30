"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FilePlus2, Save, ShieldCheck } from "lucide-react";
import AppHeader from "../../components/AppHeader";

type AdminUser={displayName:string|null;role:"USER"|"EDITOR"|"ADMIN"};
type Story={
  id:string;title:string;slug:string;type:string;audience:string;status:"DRAFT"|"REVIEW"|"PUBLISHED"|"ARCHIVED";
  language:string;summary:string|null;body:string;narrationProfile:string;intensity:string;publishedAt:string|null;
  source:{id:string;name:string;rightsStatus:string}|null;
};
type Source={id:string;name:string;license:string|null;rightsStatus:string};

const statuses=["DRAFT","REVIEW","PUBLISHED","ARCHIVED"];
const types=["STORY","MYTHOLOGY","FOLKLORE","GHOST_STORY","MORAL_TALE"];
const audiences=["KIDS","FAMILY","TEENS","ADULTS","RESEARCH"];
const profiles=["DEFAULT","SCRIPTURE","MYTHOLOGY","FOLKLORE","GHOST","KIDS","MORAL_TALE"];

export default function AdminPage(){
  const [user,setUser]=useState<AdminUser|null>(null);
  const [stories,setStories]=useState<Story[]>([]);
  const [sources,setSources]=useState<Source[]>([]);
  const [selected,setSelected]=useState<Story|null>(null);
  const [form,setForm]=useState({title:"",slug:"",type:"STORY",audience:"FAMILY",summary:"",body:"",narrationProfile:"DEFAULT",intensity:"GENTLE",status:"DRAFT",sourceId:""});
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");

  async function load(){
    const me=await fetch("/api/auth/me").then(r=>r.json());
    setUser(me.user);
    if(!me.user || (me.user.role!=="ADMIN" && me.user.role!=="EDITOR")) return;
    const res=await fetch("/api/admin/stories");
    if(res.ok){const data=await res.json();setStories(data.stories||[]);setSources(data.sources||[]);}
  }

  useEffect(()=>{load().finally(()=>setLoading(false));},[]);

  function edit(story:Story){
    setSelected(story);
    setForm({
      title:story.title,slug:story.slug,type:story.type,audience:story.audience,
      summary:story.summary||"",body:story.body,narrationProfile:story.narrationProfile,intensity:story.intensity,status:story.status,
      sourceId:story.source?.id||""
    });
    setMessage("");
  }

  function newStory(){
    setSelected(null);
    setForm({title:"",slug:"",type:"STORY",audience:"FAMILY",summary:"",body:"",narrationProfile:"DEFAULT",intensity:"GENTLE",status:"DRAFT",sourceId:""});
    setMessage("");
  }

  async function save(e:FormEvent){
    e.preventDefault();
    setMessage("Saving…");
    const res=selected
      ? await fetch("/api/admin/stories/"+selected.slug,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)})
      : await fetch("/api/admin/stories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const data=await res.json().catch(()=>({}));
    if(!res.ok){setMessage(data.error||"Unable to save.");return;}
    setMessage(selected?"Saved.":"Draft created.");
    await load();
    if(!selected && data.story) edit({...data.story,publishedAt:data.story.publishedAt||null});
  }

  if(loading) return <main className="min-h-screen bg-zinc-950"><AppHeader/><div className="mx-auto max-w-6xl px-5 py-16 text-sm text-zinc-500">Loading editorial workspace…</div></main>;

  if(!user || (user.role!=="ADMIN" && user.role!=="EDITOR")) return <main className="min-h-screen bg-zinc-950"><AppHeader/><div className="mx-auto max-w-2xl px-5 py-16"><div className="glass rounded-3xl p-8"><ShieldCheck className="h-6 w-6 text-amber-300"/><h1 className="mt-4 font-display text-3xl">Editorial access only</h1><p className="mt-3 text-sm leading-6 text-zinc-500">This workspace is available to editors and administrators. Normal reader accounts stay separate.</p><Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"><ArrowLeft className="h-4 w-4"/>Back home</Link></div></div></main>;

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs uppercase tracking-[0.2em] text-amber-300">Editorial studio</p><h1 className="mt-2 font-display text-4xl">Shape the story library.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">Draft source-aware stories, review the language, then publish them into the reader experience.</p></div>
        <button onClick={newStory} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"><FilePlus2 className="h-4 w-4"/>New story</button>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl">Stories</h2><span className="text-xs text-zinc-600">{stories.length} total</span></div>
          <div className="mt-4 space-y-2">
            {stories.map(story=><button key={story.id} onClick={()=>edit(story)} className={"w-full rounded-2xl border p-4 text-left "+(selected?.id===story.id?"border-amber-300/20 bg-amber-300/[0.05]":"border-white/5 bg-white/[0.02] hover:bg-white/[0.04]")}>
              <div className="flex items-center justify-between gap-3"><span className="font-display">{story.title}</span><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] tracking-wide text-zinc-500">{story.status}</span></div>
              <div className="mt-2 text-xs text-zinc-600">{story.type} · {story.audience} · {story.narrationProfile}</div>
            </button>)}
            {stories.length===0&&<p className="p-4 text-sm text-zinc-600">No stories yet.</p>}
          </div>
        </section>

        <section className="glass rounded-3xl p-7">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-zinc-600">{selected?"Edit story":"Create story"}</p><h2 className="mt-2 font-display text-2xl">{selected?selected.title:"New editorial draft"}</h2></div>{message&&<span className="text-xs text-zinc-500">{message}</span>}</div>
          <form onSubmit={save} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-zinc-500">Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"/></label>
              <label className="text-xs text-zinc-500">Slug<input value={form.slug} disabled={Boolean(selected)} onChange={e=>setForm({...form,slug:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"/></label>
              <label className="text-xs text-zinc-500">Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">{types.map(v=><option key={v}>{v}</option>)}</select></label>
              <label className="text-xs text-zinc-500">Audience<select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">{audiences.map(v=><option key={v}>{v}</option>)}</select></label>
              <label className="text-xs text-zinc-500">Narration<select value={form.narrationProfile} onChange={e=>setForm({...form,narrationProfile:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">{profiles.map(v=><option key={v}>{v}</option>)}</select></label>
              <label className="text-xs text-zinc-500">Intensity<select value={form.intensity} onChange={e=>setForm({...form,intensity:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">{["GENTLE","ADVENTUROUS","SPOOKY","DARK"].map(v=><option key={v}>{v}</option>)}</select></label>
              <label className="text-xs text-zinc-500 sm:col-span-2">Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">{statuses.map(v=><option key={v}>{v}</option>)}</select></label>
            </div>
            <label className="block text-xs text-zinc-500">Source / rights record<select value={form.sourceId} onChange={e=>setForm({...form,sourceId:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"><option value="">Select a source…</option>{sources.map(source=><option key={source.id} value={source.id}>{source.name} · {source.rightsStatus}</option>)}</select></label>
            <label className="block text-xs text-zinc-500">Summary<textarea value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"/></label>
            <label className="block text-xs text-zinc-500">Story body<textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})} rows={14} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none"/></label>
            <button className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"><Save className="h-4 w-4"/>{selected?"Save changes":"Create draft"}</button>
            {selected&&selected.status!=="PUBLISHED"&&form.status==="PUBLISHED"&&<span className="ml-3 inline-flex items-center gap-2 text-xs text-emerald-300"><Check className="h-3.5 w-3.5"/>Will publish immediately</span>}
          </form>
        </section>
      </div>
    </section>
  </main>
}
