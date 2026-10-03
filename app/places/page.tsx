"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Search, Sparkles } from "lucide-react";
import placesSeed from "../../data/places.seed.json";
import AppHeader from "../../components/AppHeader";

type Place={id?:string;name:string;slug:string;region?:string|null;country?:string;placeType?:string;place_type?:string;status?:string;evidence_note?:string;traditionalSignificance?:string|null;historicalSignificance?:string|null;archaeologicalEvidence?:string|null;uncertaintyNotes?:string|null};

export default function PlacesPage(){
  const [query,setQuery]=useState("");
  const [type,setType]=useState("all");
  const [places,setPlaces]=useState<Place[]>(placesSeed as Place[]);
  useEffect(()=>{fetch("/api/places").then(r=>r.ok?r.json():null).then(data=>{if(data?.places?.length)setPlaces(data.places)}).catch(()=>{});},[]);
  const normalized=places.map(p=>({...p,placeType:p.placeType||p.place_type||"place",region:p.region||p.country||""}));
  const types=["all",...Array.from(new Set(normalized.map(p=>p.placeType||"place")))];
  const visible=useMemo(()=>normalized.filter(p=>(type==="all"||p.placeType===type)&&(!query.trim()||`${p.name} ${p.region} ${p.country}`.toLowerCase().includes(query.toLowerCase()))),[query,type,places]);

  return <main className="min-h-screen">
    <AppHeader/>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-white"><ArrowLeft className="h-4 w-4"/>Home</Link>
      <p className="mt-8 text-sm text-cyan-300">Explore the world behind the stories</p>
      <h1 className="mt-2 max-w-3xl font-display text-5xl">Places people travel to, remember, worship and tell stories about.</h1>
      <p className="mt-4 max-w-2xl text-zinc-400">Traditional significance, historical evidence and uncertainty are kept separate.</p>
      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2"><Search className="ml-3 h-5 w-5 text-zinc-600"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a city, shrine or pilgrimage site..." className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-zinc-700"/></div>
      <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-2">{types.map(t=><button key={t} onClick={()=>setType(t)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs capitalize ${type===t?"border-white/20 bg-white text-black":"border-white/10 bg-white/5 text-zinc-500"}`}>{t.replaceAll("-"," ")}</button>)}</div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">{visible.map(p=><Link href={`/places/${p.slug}`} key={p.slug} className="glass rounded-3xl p-6 transition hover:-translate-y-1"><div className="flex items-center justify-between"><div className="rounded-2xl bg-cyan-300/10 p-3"><MapPin className="h-5 w-5 text-cyan-300"/></div><Sparkles className="h-4 w-4 text-zinc-700"/></div><h2 className="mt-8 font-display text-2xl">{p.name}</h2><p className="mt-1 text-sm text-zinc-500">{p.region}</p><div className="mt-5 rounded-2xl bg-black/20 p-4 text-xs leading-5 text-zinc-600">{p.evidence_note||p.uncertaintyNotes||"Source-linked place profile"}</div></Link>)}</div>
    </section>
  </main>
}
