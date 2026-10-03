import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/server/session";
import { getPrisma } from "../../../../lib/server/prisma";
import { normalizeVoiceGender } from "../../../../lib/narration";
import { ensureAudioAsset } from "../../../../lib/server/audio-assets";

export const dynamic="force-dynamic";

function canGenerate(role:string){return role==="ADMIN"||role==="EDITOR"}

export async function POST(request:NextRequest){
 const user=await getCurrentSessionUser();
 if(!user||!canGenerate(user.role))return NextResponse.json({error:"Editor access required."},{status:403});
 const prisma=getPrisma();
 if(!prisma)return NextResponse.json({error:"DATABASE_URL is not configured"},{status:503});
 try{
  const body=await request.json();
  const {workId,storyId,contentId,language="en",narrationProfile,title}=body;
  if(!workId&&!storyId&&!contentId)return NextResponse.json({error:"workId, storyId or contentId is required"},{status:400});
  const result=await ensureAudioAsset(prisma,{workId,storyId,contentId,language,voiceGender:normalizeVoiceGender(body.voice)||"female",narrationProfile,title});
  return NextResponse.json(result,{status:result.status==="READY"?200:202});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to create audiobook job."},{status:400})}
}

export async function GET(request:NextRequest){
 const user=await getCurrentSessionUser();
 if(!user||!canGenerate(user.role))return NextResponse.json({error:"Editor access required."},{status:403});
 const prisma=getPrisma();
 if(!prisma)return NextResponse.json({items:[]});
 const items=await prisma.audioJob.findMany({
    orderBy:{createdAt:"desc"},take:100,
    include:{audioAsset:{select:{id:true,title:true,status:true,totalSegments:true,language:true,narrationProfile:true,engine:true,durationMs:true}}}
  });
  return NextResponse.json({items});
}
