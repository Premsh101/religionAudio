import { PrismaClient } from "../generated/prisma/client";
import { NARRATION_BY_CATEGORY, narrationProfileFor, normalizeProfile } from "./narration";

export type AudioSource={text:string;profile:string;language:string;title:string;kind:"work"|"story"|"content"};

export async function resolveAudioSource(prisma:PrismaClient,asset:any):Promise<AudioSource>{
  if(asset.storyId){
    const story=await prisma.story.findUnique({where:{id:asset.storyId},include:{scenes:{orderBy:{sequence:"asc"}}}});
    if(!story)throw new Error("Story not found");
    const translations=(story.translations&&typeof story.translations==="object"?story.translations:{}) as Record<string,string>;
    const wanted=asset.language&&asset.language!==story.language?translations[asset.language]:undefined;
    return {text:wanted||story.scenes.map((s:any)=>s.text).join("\n\n")||story.body,profile:normalizeProfile(story.narrationProfile)!=="default"?normalizeProfile(story.narrationProfile):story.matureContent?"sensual":(story.collection&&NARRATION_BY_CATEGORY[story.collection])||narrationProfileFor(story.type,story.audience),language:asset.language||"en",title:story.title,kind:"story"};
  }
  if(asset.contentId){
    const content=await prisma.contentItem.findUnique({where:{id:asset.contentId}});
    if(!content)throw new Error("Content item not found");
    return {text:content.body,profile:narrationProfileFor(content.type,content.audience),language:asset.language||content.language||"en",title:content.title,kind:"content"};
  }
  if(asset.workId){
    const work=await prisma.work.findUnique({where:{id:asset.workId},include:{passages:{orderBy:{sequence:"asc"}}}});
    if(!work)throw new Error("Work not found");
    return {text:work.passages.map((p:any)=>p.text).join("\n\n"),profile:"scripture",language:asset.language||work.language||"en",title:work.title,kind:"work"};
  }
  throw new Error("AudioAsset must reference a work, story, or content item");
}
