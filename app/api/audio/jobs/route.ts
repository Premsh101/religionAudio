import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";
import { buildSegmentRequests } from "../../../../lib/audio-pipeline";
import { getCurrentSessionUser } from "../../../../lib/server/session";
import { resolveAudioSource } from "../../../../lib/audio-source";

export const dynamic="force-dynamic";
const url=process.env.DATABASE_URL;

function canGenerate(role:string){return role==="ADMIN"||role==="EDITOR"}

export async function POST(request:NextRequest){
 const user=await getCurrentSessionUser();
 if(!user||!canGenerate(user.role))return NextResponse.json({error:"Editor access required."},{status:403});
 if(!url)return NextResponse.json({error:"DATABASE_URL is not configured"},{status:503});
 const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:url})});
 try{
  const body=await request.json();
  const {workId,storyId,contentId,language="en",narrationProfile="DEFAULT",title}=body;
  if(!workId&&!storyId&&!contentId)return NextResponse.json({error:"workId, storyId or contentId is required"},{status:400});
  const source=await resolveAudioSource(prisma,{workId,storyId,contentId,language});
  const profile=typeof narrationProfile==="string"?narrationProfile:source.profile;
  const segments=buildSegmentRequests(source.text,profile,language);
  if(!segments.length)return NextResponse.json({error:"No source text available."},{status:400});
  const asset=await prisma.audioAsset.create({data:{
    title:title||source.title,language,narrationProfile:profile,storageKey:`pending/${Date.now()}`,
    rightsStatus:"UNKNOWN",workId:workId||undefined,storyId:storyId||undefined,contentId:contentId||undefined,
    totalSegments:segments.length,status:"QUEUED"
  }});
  await prisma.audioJob.createMany({data:segments.map(segment=>({audioAssetId:asset.id,status:"QUEUED",segmentSequence:segment.sequence}))});
  return NextResponse.json({assetId:asset.id,totalSegments:segments.length,status:"QUEUED"});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to create audiobook job."},{status:400})}
 finally{await prisma.$disconnect()}
}

export async function GET(){
 if(!url)return NextResponse.json({items:[]});
 const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:url})});
 try{
  const items=await prisma.audioJob.findMany({
    orderBy:{createdAt:"desc"},take:100,
    include:{audioAsset:{select:{id:true,title:true,status:true,totalSegments:true,language:true,narrationProfile:true,engine:true,durationMs:true}}}
  });
  return NextResponse.json({items});
 }finally{await prisma.$disconnect()}
}
