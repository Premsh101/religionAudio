import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import StoryClient from "./StoryClient";
import stories from "../../../data/stories.seed.json";
import { getPrisma } from "../../../lib/server/prisma";
import { audioPublicUrl } from "../../../lib/audio-storage";
import AppHeader from "../../../components/AppHeader";

type StorySeed={title:string;slug:string;content_type:string;audience:string;age_min:number;age_max:number;tag:string;narration_profile:string;style_notes:string;status:string;body?:string};

const typeTag:Record<string,string>={
  STORY:"Story",MYTHOLOGY:"Mythology",FOLKLORE:"Folklore",GHOST_STORY:"Ghost Story",MORAL_TALE:"Moral Tale"
};

export default async function StoryPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const prisma=getPrisma();
  const dbStory=prisma ? await prisma.story.findUnique({
    where:{slug},
    select:{
      title:true,slug:true,type:true,audience:true,ageMin:true,ageMax:true,language:true,summary:true,body:true,status:true,narrationProfile:true,
      source:{select:{name:true,url:true,license:true,rightsStatus:true}},
      id:true,coverImageKey:true,
      audioAssets:{where:{status:{in:["QUEUED","PROCESSING","READY"]},voiceId:{in:["female","male"]}},orderBy:{createdAt:"desc"},select:{id:true,voiceId:true}}
    }
  }).catch(()=>null) : null;

  if(dbStory){
    if(dbStory.status!=="PUBLISHED"){
      return <main className="min-h-screen bg-zinc-950"><AppHeader/><section className="mx-auto max-w-2xl px-5 py-16"><div className="glass rounded-3xl p-8"><ShieldCheck className="h-6 w-6 text-amber-300"/><p className="mt-4 text-xs uppercase tracking-[0.18em] text-zinc-600">Editorial status · {dbStory.status}</p><h1 className="mt-2 font-display text-3xl">{dbStory.title}</h1><p className="mt-3 text-sm leading-6 text-zinc-500">This story is not published yet. Readers will see it here after editorial review and publication.</p><Link href="/stories" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"><ArrowLeft className="h-4 w-4"/>Back to stories</Link></div></section></main>;
    }
    return <StoryClient story={{
      title:dbStory.title,
      slug:dbStory.slug,
      content_type:dbStory.type.toLowerCase(),
      audience:dbStory.audience.toLowerCase(),
      age_min:dbStory.ageMin||0,
      age_max:dbStory.ageMax||0,
      tag:typeTag[dbStory.type]||"Story",
      narration_profile:dbStory.narrationProfile.toLowerCase().replace(/_/g,"-"),
      style_notes:dbStory.summary||"",
      body:dbStory.body,
      status:dbStory.status,
      source:dbStory.source,
      storyId:dbStory.id,
      coverUrl:dbStory.coverImageKey?audioPublicUrl(dbStory.coverImageKey):null,
      audio:{female:dbStory.audioAssets.find(a=>a.voiceId==="female")?.id||null,male:dbStory.audioAssets.find(a=>a.voiceId==="male")?.id||null}
    }}/>;
  }

  const story=(stories as StorySeed[]).find(item=>item.slug===slug);
  if(!story) return <main className="min-h-screen bg-zinc-950"><AppHeader/><section className="mx-auto max-w-2xl px-5 py-16"><div className="glass rounded-3xl p-8"><h1 className="font-display text-3xl">Story not found</h1><Link href="/stories" className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4"/>Back to stories</Link></div></section></main>;

  return <StoryClient story={{
    title:story.title,
    slug:story.slug,
    content_type:story.content_type,
    audience:story.audience,
    age_min:story.age_min,
    age_max:story.age_max,
    tag:story.tag,
    narration_profile:story.narration_profile,
    style_notes:story.style_notes,
    body:story.body||"",
    status:story.status
  }}/>;
}
