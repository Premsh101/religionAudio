import Link from "next/link";
import { ArrowLeft, BookOpen, MapPin, Sparkles } from "lucide-react";
import places from "../../../data/places.seed.json";

export default async function PlacePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const place=places.find(p=>p.slug===slug) || places[0];
 return <main className="min-h-screen bg-zinc-950">
  <header className="mx-auto max-w-5xl px-5 py-5"><Link href="/places" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4"/>Sacred atlas</Link></header>
  <section className="mx-auto max-w-5xl px-5 pb-20 pt-8">
   <div className="glass rounded-[32px] p-7 md:p-10"><div className="flex items-center gap-2 text-sm text-cyan-300"><MapPin className="h-4 w-4"/>{place.region}</div><h1 className="mt-4 font-display text-5xl">{place.name}</h1><p className="mt-3 text-zinc-500 capitalize">{place.place_type.replaceAll("-"," ")}</p><div className="mt-8 grid gap-4 md:grid-cols-3"><div className="rounded-2xl bg-white/[0.03] p-5"><div className="text-xs text-zinc-600">Traditional significance</div><p className="mt-2 text-sm leading-6 text-zinc-400">To be populated from named religious/traditional sources.</p></div><div className="rounded-2xl bg-white/[0.03] p-5"><div className="text-xs text-zinc-600">Historical evidence</div><p className="mt-2 text-sm leading-6 text-zinc-400">To be populated from archaeological and academic sources.</p></div><div className="rounded-2xl bg-white/[0.03] p-5"><div className="text-xs text-zinc-600">Uncertainty</div><p className="mt-2 text-sm leading-6 text-zinc-400">Claims will be labelled where sources disagree.</p></div></div></div>
   <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="glass rounded-3xl p-6"><BookOpen className="h-5 w-5 text-amber-300"/><h2 className="mt-5 font-display text-2xl">Stories & texts</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Connect this place to books, verses, legends, biographies and festivals.</p></div><div className="glass rounded-3xl p-6"><Sparkles className="h-5 w-5 text-violet-300"/><h2 className="mt-5 font-display text-2xl">Ask about this place</h2><p className="mt-2 text-sm leading-6 text-zinc-500">The AI layer will answer from source-linked place, history and text records.</p></div></div>
  </section>
 </main>
}