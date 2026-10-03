import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import AppHeader from "../../../components/AppHeader";
import { getTranslator } from "../../../lib/i18n/server";
import WorkReader from "./WorkReader";
import { chapterOf, chaptersOf, groupVerses } from "../../../lib/books";
import { getPrisma } from "../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../lib/server/session";
import { audioPublicUrl } from "../../../lib/audio-storage";

export const dynamic="force-dynamic";

export default async function WorkReaderPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{chapter?:string;at?:string}>}){
  const {slug}=await params;
  const query=await searchParams;
  const prisma=getPrisma();
  if(!prisma) return <main className="min-h-screen"><AppHeader/><EmptyState title="Library database is offline." /></main>;

  const work=await prisma.work.findUnique({
    where:{slug},
    select:{
      id:true,title:true,language:true,translator:true,edition:true,rightsStatus:true,status:true,coverImageKey:true,summary:true,
      source:{select:{name:true,url:true,license:true}},
      audioAssets:{where:{status:{in:["QUEUED","PROCESSING","READY"]},voiceId:{in:["female","male"]}},orderBy:{createdAt:"desc"},select:{id:true,voiceId:true}},
      passages:{orderBy:{sequence:"asc"},select:{id:true,reference:true,sequence:true}}
    }
  });

  if(!work) return <main className="min-h-screen"><AppHeader/><EmptyState title={(await getTranslator())("reader.notFound")} /></main>;
  if(work.status!=="PUBLISHED"){
    const viewer=await getCurrentSessionUser();
    if(viewer?.role!=="ADMIN"&&viewer?.role!=="EDITOR") return <main className="min-h-screen"><AppHeader/><EmptyState title={(await getTranslator())("reader.notPublished")} /></main>;
  }

  const chapters=chaptersOf(work.passages);
  const at=Number(query.at);
  const atPassage=Number.isInteger(at)?work.passages.find(p=>p.sequence===at):undefined;
  const requested=atPassage?chapterOf(atPassage.reference):Number(query.chapter);
  const chapter=chapters.some(c=>c.n===requested)?requested!:(chapters[0]?.n||1);
  const ids=work.passages.filter(p=>chapterOf(p.reference)===chapter).map(p=>p.id);
  const passages=await prisma.passage.findMany({where:{id:{in:ids}},orderBy:{sequence:"asc"},select:{id:true,reference:true,sequence:true,text:true}});

  return <WorkReader work={{
    id:work.id,title:work.title,slug,language:work.language,translator:work.translator,edition:work.edition,
    rightsStatus:work.rightsStatus,source:work.source,verses:groupVerses(passages),chapters,currentChapter:chapter,totalPassages:work.passages.length,coverUrl:work.coverImageKey?audioPublicUrl(work.coverImageKey):null,summary:work.summary,initialSequence:atPassage?.sequence??null,audio:{female:work.audioAssets.find(a=>a.voiceId==="female")?.id||null,male:work.audioAssets.find(a=>a.voiceId==="male")?.id||null}
  }}/>;
}

function EmptyState({title}:{title:string}){
  return <section className="mx-auto max-w-2xl px-5 py-16"><div className="card p-8"><BookOpen className="h-6 w-6 text-acc"/><h1 className="mt-4 font-display text-4xl">{title}</h1><Link href="/library?tab=books" className="btn-outline mt-6"><ArrowLeft className="h-4 w-4 rtl:rotate-180"/>Library</Link></div></section>;
}
