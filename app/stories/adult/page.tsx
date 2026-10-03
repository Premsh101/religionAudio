import Link from "next/link";
import AppHeader from "../../../components/AppHeader";
import AdultGate from "../../../components/AdultGate";
import CoverArt from "../../../components/CoverArt";
import AdultSignOut from "./AdultSignOut";
import { hasAdultConsent } from "../../../lib/server/adult";
import { getPrisma } from "../../../lib/server/prisma";
import { audioPublicUrl } from "../../../lib/audio-storage";

export const dynamic="force-dynamic";

/** The only place adult (18+) stories are listed; nothing is shown until the age confirmation. */
export default async function AdultStoriesPage(){
  if(!(await hasAdultConsent()))return <main className="min-h-screen bg-zinc-950"><AppHeader/><AdultGate title="Stories for adults"/></main>;
  const prisma=getPrisma();
  const stories=prisma?await prisma.story.findMany({
    where:{status:"PUBLISHED",matureContent:true},
    orderBy:{publishedAt:"desc"},
    select:{slug:true,title:true,summary:true,contentWarnings:true,coverImageKey:true}
  }).catch(()=>[]):[];
  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><span className="rounded-full bg-rose-500 px-3 py-1 text-sm font-bold text-white">18+</span><h1 className="mt-4 font-display text-4xl">Stories for adults</h1><p className="mt-2 max-w-2xl text-sm text-zinc-400">Passion, longing and forbidden love from the world's great romantic literature and history. Mature themes, told with taste.</p></div>
        <AdultSignOut/>
      </div>
      {stories.length===0?<p className="mt-10 text-sm text-zinc-500">No adult stories have been published yet.</p>:
      <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {stories.map(s=><Link key={s.slug} href={"/stories/"+s.slug} className="group">
          <div className="transition group-hover:-translate-y-1"><CoverArt title={s.title} tag="For adults" kind="story" coverUrl={s.coverImageKey?audioPublicUrl(s.coverImageKey):null} size="sm"/></div>
          <p className="mt-3 line-clamp-2 text-sm font-medium text-white">{s.title}</p>
          {s.contentWarnings.length>0&&<p className="mt-1 line-clamp-1 text-[11px] text-rose-200/70">{s.contentWarnings.join(" · ")}</p>}
        </Link>)}
      </div>}
    </section>
  </main>;
}
