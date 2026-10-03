import Link from "next/link";
import { ArrowRight, BookOpen, Headphones, Sparkles } from "lucide-react";
import books from "../../data/catalog/books.json";
import AppHeader from "../../components/AppHeader";
import { getPrisma } from "../../lib/server/prisma";
import { audioPublicUrl } from "../../lib/audio-storage";
import CoverArt from "../../components/CoverArt";

// Rendered per request so newly added or approved books appear immediately.
export const dynamic="force-dynamic";

type CatalogBook={
  id:string;title:string;tradition:string;collection:string;language:string;translator?:string;edition?:string;
  license:string;source:string;source_url:string;local_path:string;type:string;
};

export default async function LibraryPage(){
  const prisma=getPrisma();
  const dbWorks=prisma ? await prisma.work.findMany({
    where:{status:"PUBLISHED"},
    orderBy:{createdAt:"asc"},
    select:{id:true,title:true,slug:true,language:true,translator:true,edition:true,rightsStatus:true,summary:true,coverImageKey:true,source:{select:{name:true,url:true,license:true}}}
  }).catch(()=>[]) : [];

  const catalog=books as CatalogBook[];
  // The bundled catalogue is only a fallback for an empty database, never a way around unpublishing.
  const dbHasWorks=dbWorks.length>0||(prisma?await prisma.work.count().catch(()=>0):0)>0;
  const merged=dbHasWorks
    ? dbWorks.map(work=>({
        id:work.id,title:work.title,tradition:work.slug.startsWith("dhammapada")?"Buddhism":work.slug.includes("jps-1917")?"Judaism":"Sacred texts",
        collection:"Primary text",language:work.language,translator:work.translator,edition:work.edition,
        license:work.source?.license||work.rightsStatus,source:work.source?.name||"ReligionAudio",
        source_url:work.source?.url||"#",slug:work.slug,
        coverUrl:work.coverImageKey?audioPublicUrl(work.coverImageKey):null,summary:work.summary
      }))
    : catalog.map(book=>({...book,slug:book.id,coverUrl:null as string|null,summary:null as string|null}));

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-8">
      <p className="text-sm text-amber-300">Your sacred library</p>
      <h1 className="mt-2 font-display text-5xl">Read something that stays with you.</h1>
      <p className="mt-4 max-w-2xl text-zinc-400">Primary texts first. Stories and explanations around them. Every edition carries source and rights metadata.</p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {merged.map(book=><article key={book.slug} className="glass grid grid-cols-[96px_1fr] gap-5 rounded-3xl p-6 transition hover:-translate-y-1 sm:grid-cols-[120px_1fr]">
          <CoverArt title={book.title} tag={book.tradition} kind="work" coverUrl={book.coverUrl} size="sm"/>
          <div className="min-w-0">
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-white/5 p-3"><BookOpen className="h-5 w-5"/></div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-500">{book.license}</span>
          </div>
          <p className="mt-7 text-xs uppercase tracking-[0.18em] text-zinc-600">{book.tradition} · {book.collection}</p>
          <h2 className="mt-2 font-display text-3xl">{book.title}</h2>
          <p className="mt-2 text-sm text-zinc-500">{book.summary || book.edition || book.translator || book.language}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={book.slug==="dhammapada-sujato-en"?"/read/dhammapada":"/read/"+book.slug} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"><Headphones className="h-4 w-4"/> Read + Listen</Link>
            {book.source_url!=="#"&&<a href={book.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300">Source <ArrowRight className="h-4 w-4"/></a>}
          </div>
          </div>
        </article>)}
      </div>

      <div className="mt-8 rounded-3xl border border-violet-300/10 bg-violet-300/[0.04] p-7">
        <div className="flex items-center gap-2 text-violet-300"><Sparkles className="h-4 w-4"/> Growing library</div>
        <p className="mt-3 text-sm leading-6 text-zinc-500">The ingestion pipeline is rights-first. Additional public-domain/open collections can be added without changing the reader or account system.</p>
      </div>
    </section>
  </main>
}
