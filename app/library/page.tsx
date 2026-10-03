import Link from "next/link";
import { ArrowRight, BookOpen, Headphones } from "lucide-react";
import books from "../../data/catalog/books.json";
import AppHeader from "../../components/AppHeader";
import { getPrisma } from "../../lib/server/prisma";
import { audioPublicUrl } from "../../lib/audio-storage";
import CoverArt from "../../components/CoverArt";
import SiteFooter from "../../components/SiteFooter";
import { getTranslator } from "../../lib/i18n/server";

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

  const t=await getTranslator();
  return <main className="page-glow min-h-screen">
    <AppHeader/>
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-8 md:pt-12">
      <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{t("library.title")}</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">{t("library.sub")}</p>

      {merged.length?<div className="mt-8 grid gap-4 md:grid-cols-2">
        {merged.map(book=><Link key={book.slug} href={book.slug==="dhammapada-sujato-en"?"/read/dhammapada":"/read/"+book.slug} className="glass group grid grid-cols-[96px_1fr] items-center gap-5 rounded-3xl p-4 transition hover:-translate-y-1 hover:border-white/15 sm:grid-cols-[120px_1fr] sm:p-5">
          <CoverArt title={book.title} tag={book.tradition} kind="work" coverUrl={book.coverUrl} size="sm"/>
          <div className="min-w-0">
            <p className="text-xs font-medium text-amber-300">{book.tradition}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">{book.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{book.summary || book.edition || book.translator || book.language}</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition group-hover:bg-amber-200"><Headphones className="h-4 w-4"/>{t("library.open")}</span>
          </div>
        </Link>)}
      </div>:<div className="glass mt-8 rounded-3xl p-10 text-center text-zinc-400">{t("library.none")}</div>}

      <Link href="/stories" className="mt-8 flex items-center justify-between gap-4 rounded-3xl border border-amber-300/15 bg-amber-300/[0.05] p-6 transition hover:border-amber-300/30">
        <div className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-300"><BookOpen className="h-6 w-6"/></span><div><p className="font-display text-xl font-semibold">{t("library.storiesTitle")}</p><p className="mt-1 text-sm text-zinc-400">{t("library.storiesBody")}</p></div></div>
        <ArrowRight className="h-5 w-5 shrink-0 text-amber-300 rtl:rotate-180"/>
      </Link>
    </section>
    <SiteFooter/>
  </main>
}
