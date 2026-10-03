import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../../lib/server/prisma";
import { normalizeVoiceGender } from "../../../../lib/narration";
import { ensureAudioAsset } from "../../../../lib/server/audio-assets";
import { PRIORITY_LISTENER } from "../../../../lib/server/narration-plan";
import { hasAdultConsent } from "../../../../lib/server/adult";
import { RULES, clientIp, hit, isLimited, tooManyRequests } from "../../../../lib/server/rate-limit";

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
  const ip=clientIp(request);
  // Narration that already exists is free to open; starting new generation is limited per network.
  const limited=await isLimited(RULES.narrationRequestPerIp,ip);
  const countIfNew=async(result:{reused:boolean;assetId:string;status:string})=>{
    if(!result.reused)await hit(RULES.narrationRequestPerIp,ip);
    // Someone is waiting: narration queued in bulk from the Studio jumps ahead in the queue.
    else if(result.status!=="READY")await prisma.audioJob.updateMany({where:{audioAssetId:result.assetId,status:"QUEUED",priority:{lt:PRIORITY_LISTENER}},data:{priority:PRIORITY_LISTENER}});
  };
  try{
    if(typeof body.storyId==="string"){
      const story=await prisma.story.findUnique({where:{id:body.storyId},select:{id:true,status:true,language:true,matureContent:true,translations:true}});
      if(!story||story.status!=="PUBLISHED")return NextResponse.json({error:"Story not found."},{status:404});
      if(story.matureContent&&!(await hasAdultConsent()))return NextResponse.json({error:"Confirm you are 18 or older to listen."},{status:403});
      const translations=(story.translations&&typeof story.translations==="object"?story.translations:{}) as Record<string,string>;
      // Narration voices exist for English and Hindi; Hindi is used only when the story has a Hindi text.
      const language=body.language==="hi"&&(languageCode(story.language)==="hi"||translations.hi)?"hi":languageCode(story.language);
      const result=await ensureAudioAsset(prisma,{storyId:story.id,language,voiceGender,priority:PRIORITY_LISTENER,existingOnly:!limited.ok});
      if(!result)return tooManyRequests(limited,"You've started a lot of new narrations.");
      await countIfNew(result);
      return NextResponse.json(result,{status:result.status==="READY"?200:202});
    }
    if(typeof body.workId==="string"){
      const work=await prisma.work.findUnique({where:{id:body.workId},select:{id:true,language:true,status:true}});
      if(!work||work.status!=="PUBLISHED")return NextResponse.json({error:"Book not found."},{status:404});
      const result=await ensureAudioAsset(prisma,{workId:work.id,language:languageCode(work.language),voiceGender,priority:PRIORITY_LISTENER,existingOnly:!limited.ok});
      if(!result)return tooManyRequests(limited,"You've started a lot of new narrations.");
      await countIfNew(result);
      return NextResponse.json(result,{status:result.status==="READY"?200:202});
    }
    return NextResponse.json({error:"storyId or workId is required."},{status:400});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to prepare narration."},{status:400});
  }
}
