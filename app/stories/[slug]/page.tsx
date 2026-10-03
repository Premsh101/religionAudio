import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import StoryClient from "./StoryClient";
import stories from "../../../data/stories.seed.json";
import { getPrisma } from "../../../lib/server/prisma";
import { audioPublicUrl } from "../../../lib/audio-storage";
import { hasAdultConsent } from "../../../lib/server/adult";
import { getCurrentSessionUser } from "../../../lib/server/session";
import AdultGate from "../../../components/AdultGate";
import AppHeader from "../../../components/AppHeader";
import { asTranslations } from "../../../lib/story-i18n";
import { categoryOf } from "../../../lib/categories";
import { getTranslator } from "../../../lib/i18n/server";

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
      id:true,coverImageKey:true,matureContent:true,translations:true,collection:true,
      audioAssets:{where:{status:{in:["QUEUED","PROCESSING","READY"]},voiceId:{in:["female","male"]}},orderBy:{createdAt:"desc"},select:{id:true,voiceId:true,language:true}}
    }
  }).catch(()=>null) : null;

  if(dbStory){
    const viewer=dbStory.status!=="PUBLISHED"?await getCurrentSessionUser():null;
    const canPreview=viewer?.role==="ADMIN"||viewer?.role==="EDITOR";
    if(dbStory.status!=="PUBLISHED"&&!canPreview){
      const t=await getTranslator();
      return <main className="min-h-screen"><AppHeader/><section className="mx-auto max-w-2xl px-5 py-16"><div className="card p-8"><ShieldCheck className="h-6 w-6 text-acc"/><h1 className="mt-4 font-display text-4xl">{dbStory.title}</h1><p className="mt-3 text-mut">{t("story.notPublished")}</p><Link href="/stories" className="btn-outline mt-6"><ArrowLeft className="h-4 w-4 rtl:rotate-180"/>{t("story.back")}</Link></div></section></main>;
    }
    if(dbStory.matureContent&&!(await hasAdultConsent())){
      return <main className="min-h-screen"><AppHeader/><AdultGate title={dbStory.title}/></main>;
    }
    const assetsFor=(lang:string)=>({female:dbStory.audioAssets.find(a=>a.voiceId==="female"&&a.language===lang)?.id||null,male:dbStory.audioAssets.find(a=>a.voiceId==="male"&&a.language===lang)?.id||null});
    const translations=asTranslations(dbStory.translations);
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
      audio:assetsFor(dbStory.language),
      audioByLanguage:{[dbStory.language]:assetsFor(dbStory.language),hi:assetsFor("hi")},
      language:dbStory.language,
      translations,
      mature:dbStory.matureContent,
      previewStatus:dbStory.status!=="PUBLISHED"?dbStory.status:null,
      category:dbStory.matureContent?"romance":categoryOf(dbStory)
    }}/>;
  }

  const story=(stories as StorySeed[]).find(item=>item.slug===slug);
  if(!story){
    const t=await getTranslator();
    return <main className="min-h-screen"><AppHeader/><section className="mx-auto max-w-2xl px-5 py-16"><div className="card p-8"><h1 className="font-display text-4xl">{t("story.notFound")}</h1><Link href="/stories" className="btn-outline mt-6"><ArrowLeft className="h-4 w-4 rtl:rotate-180"/>{t("story.back")}</Link></div></section></main>;
  }

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
    status:story.status,
    category:categoryOf({type:story.content_type.toUpperCase(),audience:story.audience.toUpperCase()})
  }}/>;
}
