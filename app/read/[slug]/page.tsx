import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import AppHeader from "../../../components/AppHeader";
import WorkReader from "./WorkReader";
import { getPrisma } from "../../../lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function WorkReaderPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const prisma=getPrisma();
  if(!prisma){
    return <main className="min-h-screen bg-zinc-950"><AppHeader/><EmptyState title="Library database is offline." /></main>;
  }

  const work=await prisma.work.findUnique({
    where:{slug},
    select:{
      id:true,title:true,language:true,translator:true,edition:true,rightsStatus:true,
      source:{select:{name:true,url:true,license:true}},
      passages:{orderBy:{sequence:"asc"},take:800,select:{id:true,reference:true,sequence:true,text:true}}
    }
  });

  if(!work){
    return <main className="min-h-screen bg-zinc-950"><AppHeader/><EmptyState title="Book not found." /></main>;
  }

  return <WorkReader work={{
    id:work.id,title:work.title,slug,language:work.language,translator:work.translator,edition:work.edition,
    rightsStatus:work.rightsStatus,source:work.source,passages:work.passages
  }}/>;
}

function EmptyState({title}:{title:string}){
  return <section className="mx-auto max-w-2xl px-5 py-16"><div className="glass rounded-3xl p-8"><BookOpen className="h-6 w-6 text-amber-300"/><h1 className="mt-4 font-display text-3xl">{title}</h1><p className="mt-3 text-sm text-zinc-500">Return to the library and choose another text.</p><Link href="/library" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"><ArrowLeft className="h-4 w-4"/>Library</Link></div></section>;
}
