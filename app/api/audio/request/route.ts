import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../../lib/server/prisma";
import { normalizeVoiceGender } from "../../../../lib/narration";
import { ensureAudioAsset } from "../../../../lib/server/audio-assets";

export const dynamic="force-dynamic";

function languageCode(value?:string|null){
  const v=(value||"").toLowerCase();
  if(v.startsWith("hi")||v==="hindi")return "hi";
  return "en";
}

/**
 * Public: "listen to the full narration". The first listener's request queues generation for that
 * story/work + voice; everyone after that gets the same stored audio. Only published content qualifies.
 */
export async function POST(request:NextRequest){
  const prisma=getPrisma();
  if(!prisma)return NextResponse.json({error:"Narration is not available right now."},{status:503});
  const body=await request.json().catch(()=>({}));
  const voiceGender=normalizeVoiceGender(body.voice)||"female";
  try{
    if(typeof body.storyId==="string"){
      const story=await prisma.story.findUnique({where:{id:body.storyId},select:{id:true,status:true,language:true}});
      if(!story||story.status!=="PUBLISHED")return NextResponse.json({error:"Story not found."},{status:404});
      const result=await ensureAudioAsset(prisma,{storyId:story.id,language:languageCode(story.language),voiceGender});
      return NextResponse.json(result,{status:result.status==="READY"?200:202});
    }
    if(typeof body.workId==="string"){
      const work=await prisma.work.findUnique({where:{id:body.workId},select:{id:true,language:true,status:true}});
      if(!work||work.status!=="PUBLISHED")return NextResponse.json({error:"Book not found."},{status:404});
      const result=await ensureAudioAsset(prisma,{workId:work.id,language:languageCode(work.language),voiceGender});
      return NextResponse.json(result,{status:result.status==="READY"?200:202});
    }
    return NextResponse.json({error:"storyId or workId is required."},{status:400});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to prepare narration."},{status:400});
  }
}
