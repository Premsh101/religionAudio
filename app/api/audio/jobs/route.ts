import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";

export const dynamic="force-dynamic";
const url=process.env.DATABASE_URL;

export async function POST(request:NextRequest){
 if(!url)return NextResponse.json({error:"DATABASE_URL is not configured"},{status:503});
 const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:url})});
 try{
  const body=await request.json();
  const {workId,storyId,contentId,language="en",narrationProfile="DEFAULT",title}=body;
  if(!workId&&!storyId&&!contentId)return NextResponse.json({error:"workId, storyId or contentId is required"},{status:400});
  const asset=await prisma.audioAsset.create({data:{title:title||"Audiobook",language,narrationProfile,storageKey:`pending/${Date.now()}`,rightsStatus:"RESEARCH_ONLY",workId:workId||undefined,storyId:storyId||undefined,contentId:contentId||undefined}});
  const job=await prisma.audioJob.create({data:{audioAssetId:asset.id,status:"QUEUED"}});
  return NextResponse.json({assetId:asset.id,jobId:job.id,status:job.status});
 }finally{await prisma.$disconnect()}
}

export async function GET(){
 if(!url)return NextResponse.json({items:[]});
 const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:url})});
 try{const items=await prisma.audioJob.findMany({orderBy:{createdAt:"desc"},take:50,include:{audioAsset:{select:{id:true,title:true,language:true,narrationProfile:true,engine:true,durationMs:true}}}});return NextResponse.json({items})}finally{await prisma.$disconnect()}
}
