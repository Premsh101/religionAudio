import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../../generated/prisma/client";
import { audioPublicUrl } from "../../../../../lib/audio-storage";

export const dynamic="force-dynamic";
const url=process.env.DATABASE_URL;

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 if(!url)return NextResponse.json({error:"DATABASE_URL is not configured."},{status:503});
 const {id}=await params;
 const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:url})});
 try{
   const asset=await prisma.audioAsset.findUnique({
     where:{id},
     select:{id:true,title:true,status:true,totalSegments:true,durationMs:true,language:true,narrationProfile:true,engine:true,story:{select:{title:true,slug:true,status:true}},work:{select:{title:true,slug:true}},content:{select:{title:true,slug:true}},segments:{orderBy:{sequence:"asc"},select:{id:true,sequence:true,startMs:true,endMs:true,storageKey:true,transcript:true}}}
   });
   if(!asset)return NextResponse.json({error:"Audio asset not found."},{status:404});
   if(asset.status!=="READY")return NextResponse.json({error:"Audio asset is not ready.",status:asset.status,totalSegments:asset.totalSegments},{status:409});
   const isPublic=asset.story?.status==="PUBLISHED" || Boolean(asset.work) || Boolean(asset.content);
   if(!isPublic)return NextResponse.json({error:"Audio asset is not public."},{status:403});
   return NextResponse.json({
     asset:{id:asset.id,title:asset.title,status:asset.status,totalSegments:asset.totalSegments,durationMs:asset.durationMs,language:asset.language,narrationProfile:asset.narrationProfile,engine:asset.engine},
     segments:asset.segments.map(segment=>({...segment,url:segment.storageKey?audioPublicUrl(segment.storageKey):null}))
   });
 }finally{await prisma.$disconnect()}
}
