import Link from "next/link";
import { ArrowLeft, BookOpen, MapPin, Sparkles } from "lucide-react";
import placesSeed from "../../../data/places.seed.json";
import { getPrisma } from "../../../lib/server/prisma";
import AppHeader from "../../../components/AppHeader";

export const dynamic="force-dynamic";

export default async function PlacePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const prisma=getPrisma();
 const dbPlace=prisma?await prisma.place.findUnique({where:{slug},select:{name:true,slug:true,country:true,region:true,placeType:true,latitude:true,longitude:true,traditionalSignificance:true,historicalSignificance:true,archaeologicalEvidence:true,uncertaintyNotes:true,source:{select:{name:true,url:true,license:true,rightsStatus:true}}}}).catch(()=>null):null;
 const seed=(placesSeed as any[]).find(p=>p.slug===slug);
 const place=dbPlace||seed;
 if(!place) return <main className="min-h-screen"><AppHeader/><section className="mx-auto max-w-3xl px-5 py-16"><div className="glass rounded-3xl p-8"><h1 className="font-display text-3xl">Place not found</h1><Link href="/places" className="mt-6 inline-flex text-sm text-zinc-400 hover:text-white">← Sacred atlas</Link></div></section></main>;
 const traditional=place.traditionalSignificance||"Traditional significance will be populated from named religious and cultural sources.";
 const historical=place.historicalSignificance||"Historical context will be populated from academic, archival and archaeological sources.";
 const archaeology=place.archaeologicalEvidence||"No archaeological evidence has been entered in the current record.";
 const uncertainty=place.uncertaintyNotes||"Claims will be labelled where sources disagree or evidence is incomplete.";
 return <main className="min-h-screen">
  <AppHeader/>
  <header className="mx-auto max-w-5xl px-5 py-5"><Link href="/places" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4"/>Sacred atlas</Link></header>
  <section className="mx-auto max-w-5xl px-5 pb-20 pt-8">
   <div className="glass rounded-[32px] p-7 md:p-10"><div className="flex items-center gap-2 text-sm text-cyan-300"><MapPin className="h-4 w-4"/>{place.region||place.country}</div><h1 className="mt-4 font-display text-5xl">{place.name}</h1><p className="mt-3 text-zinc-500 capitalize">{(place.placeType||place.place_type||"place").replaceAll("-"," ")}</p>
    <div className="mt-8 grid gap-4 md:grid-cols-2"><Info title="Traditional significance" text={traditional}/><Info title="Historical context" text={historical}/><Info title="Archaeological evidence" text={archaeology}/><Info title="Uncertainty" text={uncertainty}/></div>
    {place.source&&<div className="mt-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.03] p-5"><div className="text-xs uppercase tracking-[0.16em] text-emerald-300">Source & rights</div><div className="mt-2 text-sm text-zinc-300">{place.source.name}</div><div className="mt-1 text-xs text-zinc-600">{place.source.license||place.source.rightsStatus}</div><a href={place.source.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-zinc-400 hover:text-white">Open source →</a></div>}
   </div>
   <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="glass rounded-3xl p-6"><BookOpen className="h-5 w-5 text-amber-300"/><h2 className="mt-5 font-display text-2xl">Stories & texts</h2><p className="mt-2 text-sm leading-6 text-zinc-500">This place can be connected to books, verses, legends, biographies and festivals as those records are ingested.</p></div><div className="glass rounded-3xl p-6"><Sparkles className="h-5 w-5 text-violet-300"/><h2 className="mt-5 font-display text-2xl">Ask about this place</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Use the evidence-aware AI to distinguish tradition, scholarship and scientific evidence.</p><Link href="/ai" className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">Ask AI →</Link></div></div>
  </section>
 </main>
}

function Info({title,text}:{title:string;text:string}){return <div className="rounded-2xl bg-white/[0.03] p-5"><div className="text-xs text-zinc-600">{title}</div><p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p></div>}
